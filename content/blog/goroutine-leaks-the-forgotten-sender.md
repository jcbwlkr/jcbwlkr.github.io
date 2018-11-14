+++
date = "2018-11-12"
title = "Goroutine Leaks - The Forgotten Sender"
categories = ["go"]
tags = ["concurrency"]
description = "Goroutine leaks are a common source of memory leaks in concurrent programs. This post defines Goroutine leaks and provides one example of a leak that is easy to miss in production code."
canonical = "https://www.ardanlabs.com/blog/2018/11/goroutine-leaks-the-forgotten-sender.html"
+++

This post was originally published on the [Ardan Labs Blog](https://www.ardanlabs.com/blog/2018/11/goroutine-leaks-the-forgotten-sender.html).

### Introduction

Concurrent programming allows developers to solve problems using more than one path of execution and is often used in an attempt to improve performance. Concurrency doesn’t mean these multiple paths are executing in parallel; it means these paths are executing out-of-order instead of sequentially. Historically, this type of programming is facilitated using libraries that are either provided by a standard library or from 3rd party developers.

In Go, concurrency features like Goroutines and channels are built into the language and runtime to reduce or eliminate the need for libraries. This has created the illusion that writing concurrent programs in Go is easy. You must be cautious when deciding to use concurrency as it comes with some unique side effects or traps if not used correctly. These traps can create complexity and nasty bugs if you’re not careful.

The traps I will discuss in this post are related to Goroutine leaks.
### Leaking Goroutines

When it comes to memory management, Go deals with many of the details for you. The Go compiler decides where values are located in memory using [escape analysis](https://www.ardanlabs.com/blog/2017/05/language-mechanics-on-escape-analysis.html). The runtime tracks and manages heap allocations through the use of the [garbage collector](https://blog.golang.org/ismmkeynote). Though it’s not impossible to create [memory leaks](https://en.wikipedia.org/wiki/Memory_leak) in your applications, the chances are greatly reduced.

A common type of memory leak is leaking Goroutines. If you start a Goroutine that you expect to eventually terminate but it never does then it has leaked. It lives for the lifetime of the application and any memory allocated for the Goroutine can’t be released. This is part of the reasoning behind the advice "[Never start a goroutine without knowing how it will stop](https://dave.cheney.net/2016/12/22/never-start-a-goroutine-without-knowing-how-it-will-stop)".

To illustrate a basic Goroutine leak, look at the following code:

**Listing 1**  
https://play.golang.org/p/dsu3PARM24K
```go
31 // leak is a buggy function. It launches a goroutine that
32 // blocks receiving from a channel. Nothing will ever be
33 // sent on that channel and the channel is never closed so
34 // that goroutine will be blocked forever.
35 func leak() {
36     ch := make(chan int)
37 
38     go func() {
39         val := <-ch
40         fmt.Println("We received a value:", val)
41     }()
42 }
```

Listing 1 defines a function named `leak`. The function creates a channel on line 36 that allows Goroutines to pass integer data. Then on line 38 Goroutine is created which blocks on line 39 waiting to receive a value from the channel. While that Goroutine is waiting, the `leak` function returns. At this point, no other part of the program can send a signal over the channel. This leaves the Goroutine blocked on line 39 waiting indefinitely. The `fmt.Println` call on line 40 will never happen.

In this example, the Goroutine leak could be quickly identified during a code review. Unfortunately, Goroutine leaks in production code are usually more difficult to find. I can’t show every possible way a Goroutine leak can happen, but this post will detail one kind of Goroutine leak that you may encounter:

### Leak: The Forgotten Sender

_**For this leak example you will see a Goroutine that is blocked indefinitely, waiting to send a value on a channel.**_

The program we will look at finds a record based on some search term which is then printed. The program is built around a function called `search`:

**Listing 2**  
https://play.golang.org/p/o6_eMjxMVFv
```go
29 // search simulates a function that finds a record based
30 // on a search term. It takes 200ms to perform this work.
31 func search(term string) (string, error) {
32     time.Sleep(200 * time.Millisecond)
33     return "some value", nil
34 }
```

The `search` function on line 31 in Listing 2 is a mock implementation to simulate a long running operation like a database query or a web call. In this example, it is hard-coded to take 200ms.

The program calls the `search` function as shown in Listing 3.

**Listing 3**  
https://play.golang.org/p/o6_eMjxMVFv
```go
17 // process is the work for the program. It finds a record
18 // then prints it.
19 func process(term string) error {
20     record, err := search(term)
21     if err != nil {
22         return err
23     }
24
25     fmt.Println("Received:", record)
26     return nil
27 }
```

In Listing 3 on line 19, a function called `process` is defined which takes a single `string` argument representing a search term. On line 20, the `term` variable is then passed to the `search` function which returns a record and an error. If an error occurs, the error is returned to the caller on line 22. If there was no error, the record is printed on line 25.

For some applications the latency incurred when calling `search` sequentially may be unacceptable. Assuming the `search` function can’t be made to run any faster, the `process` function can be changed to not consume the total latency cost incurred by `search`.

To do this, a Goroutine can be used as shown in Listing 4 below. Unfortunately this first attempt is buggy as it creates a potential Goroutine leak.

**Listing 4**  
https://play.golang.org/p/m0DHuchgX0A
```go
38 // result wraps the return values from search. It allows us
39 // to pass both values across a single channel.
40 type result struct {
41     record string
42     err    error
43 }
44 
45 // process is the work for the program. It finds a record
46 // then prints it. It fails if it takes more than 100ms.
47 func process(term string) error {
48 
49     // Create a context that will be canceled in 100ms.
50     ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
51     defer cancel()
52 
53     // Make a channel for the goroutine to report its result.
54     ch := make(chan result)
55 
56     // Launch a goroutine to find the record. Create a result
57     // from the returned values to send through the channel.
58     go func() {
59         record, err := search(term)
60         ch <- result{record, err}
61     }()
62 
63     // Block waiting to either receive from the goroutine's
64     // channel or for the context to be canceled.
65     select {
66     case <-ctx.Done():
67         return errors.New("search canceled")
68     case result := <-ch:
69         if result.err != nil {
70             return result.err
71         }
72         fmt.Println("Received:", result.record)
73         return nil
74     }
75 }
```

In listing 4 on line 50, the `process` function is rewritten to create a `Context` that will be canceled in 100ms. For more information on how to use `Context` read the [golang.org blog post](https://blog.golang.org/context).

Then on line 54, the program creates an unbuffered channel that allows Goroutines to pass data of the `result` type. On lines 58 to 61 an anonymous function is defined and then called as a Goroutine. This Goroutine calls `search` and attempts to send its return values through the channel on line 60. 

While the Goroutine is doing its work, the `process` function executes the `select` block on line 65. This block has two cases which are both channel receive operations. 

On line 66 there is a case which receives from the `ctx.Done()` channel. This case will be executed if the `Context` gets canceled (the 100ms duration passes). If this case is executed, then `process` will return an error indicating that it gave up waiting for `search` on line 67.

Alternatively, the case on line 68 receives from the `ch` channel and assigns the value to a variable named `result`. As before in the sequential implementation, the program checks and handles the error on lines 69 and 70. If there was no error, the program prints the record on line 72 and returns `nil` to indicate success.

This refactoring sets a maximum duration the `process` function will wait on `search` to complete. However this implementation also creates a potential Goroutine leak. Think about what the Goroutine in this code is doing; on line 60 it sends on the channel. Sending on this channel blocks execution until another Goroutine is ready to receive the value. In the timeout case, the receiver stops waiting to receive from the Goroutine and moves on. This will cause the  Goroutine to block **forever** waiting for a receiver to appear which can never happen. This is when the Goroutine leaks.

#### Fix: Make Some Space

The simplest way to resolve this leak is to change the channel from an unbuffered channel to a buffered channel with a capacity of 1.

**Listing 5**  
https://play.golang.org/p/u3xtQ48G3qK
```go
53     // Make a channel for the goroutine to report its result.
54     // Give it capacity so sending doesn't block.
55     ch := make(chan result, 1)
```

Now in the timeout case, after the receiver has moved on, the search Goroutine will complete its send by placing the `result` value in the channel then it will return. The memory for that Goroutine will eventually be reclaimed as well as the memory for the channel. Everything will naturally work itself out.

In [The Behavior of Channels](https://www.ardanlabs.com/blog/2017/10/the-behavior-of-channels.html) William Kennedy gives several great examples of channel behavior and provides philosophy regarding their use. The final example of that article ["Listing 10"](https://www.ardanlabs.com/blog/2017/10/the-behavior-of-channels.html#signal-without-data-context)  shows a program similar to this timeout example. Read that article for more advice on when to use buffered channels and what level of capacity is appropriate.
### Conclusion

Go makes it simple to start Goroutines but it is our responsibility to use them wisely. In this post, I have shown one example of how Goroutines can be used incorrectly. There are many more ways to create Goroutine leaks as well as other traps you may encounter when using concurrency. In future posts, I will provide more examples of Goroutine leaks and other concurrency traps. For now I will leave you with this advice; any time you start a Goroutine you must ask yourself:

- When will it terminate?
- What could prevent it from terminating?

_**Concurrency is a useful tool, but it must be used with caution.**_
