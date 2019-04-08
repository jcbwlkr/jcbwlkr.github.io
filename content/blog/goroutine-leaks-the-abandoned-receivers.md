+++
date = "2018-12-19"
title = "Goroutine Leaks - The Abandoned Receivers"
categories = ["go"]
tags = ["concurrency"]
description = "Goroutine Leaks are a common cause of memory leaks in Go programs. In my previous post, I presented an introduction to Goroutine leaks and provided one example of a common mistake that many Go developers make. Continuing that work, this post presents another scenario on how Goroutines could be leaked."
canonical = "https://www.ardanlabs.com/blog/2018/12/goroutine-leaks-the-abandonded-receivers.html"
+++

This post was originally published on the [Ardan Labs Blog](https://www.ardanlabs.com/blog/2018/12/goroutine-leaks-the-abandonded-receivers.html).

### Introduction

Goroutine Leaks are a common cause of memory leaks in Go programs. In my [previous post](https://jacob-walker.com/blog/goroutine-leaks-the-forgotten-sender.html), I presented an introduction to Goroutine leaks and provided one example of a common mistake that many Go developers make. Continuing that work, this post presents another scenario on how Goroutines could be leaked.

### Leak: The Abandoned Receivers

_**For this leak example you will see multiple Goroutines blocked waiting to receive values that will never be sent.**_

The program for this post starts multiple Goroutines to process a batch of records from a file. Each Goroutine receives values from an input channel and then sends new values through an output channel.

**Listing 1**  
https://play.golang.org/p/Jtpla_UvrmN
```
35 // processRecords is given a slice of values such as lines
36 // from a file. The order of these values is not important
37 // so the function can start multiple workers to perform some
38 // processing on each record then feed the results back.
39 func processRecords(records []string) {
40 
41     // Load all of the records into the input channel. It is
42     // buffered with just enough capacity to hold all of the
43     // records so it will not block.
44 
45     total := len(records)
46     input := make(chan string, total)
47     for _, record := range records {
48         input <- record
49     }
50     // close(input) // What if we forget to close the channel?
51 
52     // Start a pool of workers to process input and send
53     // results to output. Base the size of the worker pool on
54     // the number of logical CPUs available.
55 
56     output := make(chan string, total)
57     workers := runtime.NumCPU()
58     for i := 0; i < workers; i++ {
59         go worker(i, input, output)
60     }
61 
62     // Receive from output the expected number of times. If 10
63     // records went in then 10 will come out.
64 
65     for i := 0; i < total; i++ {
66         result := <-output
67         fmt.Printf("[result  ]: output %s\n", result)
68     }
69 }
70 
71 // worker is the work the program wants to do concurrently.
72 // This is a blog post so all the workers do is capitalize a
73 // string but imagine they are doing something important.
74 //
75 // Each goroutine can't know how many records it will get so
76 // it must use the range keyword to receive in a loop.
77 func worker(id int, input <-chan string, output chan<- string) {
78     for v := range input {
79         fmt.Printf("[worker %d]: input %s\n", id, v)
80         output <- strings.ToUpper(v)
81     }
82     fmt.Printf("[worker %d]: shutting down\n", id)
83 }
```

In Listing 1 on line 39, a function called `processRecords` is defined. The function accepts a slice of `string` values. On line 46, a buffered channel called `input` is created. Lines 47 and 48 run a loop that copies every `string` value from the slice and sends them into the channel. The `input` channel is created with enough capacity to hold every value from the slice, so none of the channel sends on line 48 will block. This channel is a pipeline to distribute the values across multiple Goroutines.

Next on lines 56 through 60, the program creates a pool of Goroutines to receive the work from the pipeline. On line 56, a buffered channel named `output` is created; this is where each Goroutine will send its result. Lines 57 to 59 run a loop to create a number of Goroutines using the `worker` function. The number of Goroutines equals the number of logical CPUs on the machine. A copy of the loop variable `i` as well as the `input` and `output` channels are passed in to the Goroutine.

The `worker` function is defined on line 77. The function’s signature defines `input` as a `<-chan string`  which means it’s a receive-only channel. The function also accepts `output` as a `chan<- string` which means it’s a send-only channel.

Inside the function, the Goroutines are receiving from the `input` channel using a `range` loop on line 78. Using `range` on a channel receives in a loop until the channel is closed and empty of values. For each iteration, the received value is assigned to the iteration variable `v` which is printed on line 79. Then on line 80, the `worker` function passes `v` to the `strings.ToUpper` function which returns a new `string`. The worker immediately sends that new `string` on the `output` channel.

Back in the `processRecords` function, execution has moved down to line 65 where it is running another loop. This loop iterates until it has received and processed all values from the `output` channel. On line 66, the `processRecords` function waits to receive a value from one of the worker Goroutines. The received values are printed on line 67. When the program has received a value for each input, it exits the loop and terminates the function.

Running this program prints the transformed data so it seems to work, but the program is leaking multiple Goroutines. The program never reaches line 82 which would announce that the worker is shutting down. Even after the `processRecords` function returns, each of the worker Goroutines is still alive and waiting for input on line 78. Ranging over a channel receives until the channel is **closed and empty**. The problem is that the program never closes the channel.

#### Fix: Signal Completion

Fixing the leak only needs one line of code: `close(input)`. Closing a channel is a way of signaling "no more data will be sent". The most appropriate place to close the channel is right after the last value is sent on line 50 as shown in Listing 2:

**Listing 2**  
https://play.golang.org/p/QNsxbT0eIay
```
45     total := len(records)
46     input := make(chan string, total)
47     for _, record := range records {
48         input <- record
49     }
50     close(input)
```

It’s valid to close a buffered channel that still has values in its buffer; the channel is only closed for sending, not receiving. The worker Goroutines running `range input` will work through the buffer until they are signaled the channel has been closed. This lets the workers finish their loop before terminating.

### Conclusion

As mentioned in the previous post, Go makes it simple to start Goroutines but it’s your responsibility to use them carefully. In this post, I have shown another Goroutine mistake that can be easily made. There are still many more ways to create Goroutine leaks as well as other traps you may encounter when using concurrency. Future posts will continue discussing these traps. As always, I will continue to repeat the advice "[Never start a goroutine without knowing how it will stop](https://dave.cheney.net/2016/12/22/never-start-a-goroutine-without-knowing-how-it-will-stop)".

_**Concurrency is a useful tool, but it must be used with caution.**_


