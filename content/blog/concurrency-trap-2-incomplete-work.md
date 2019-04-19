+++
title = "Concurrency Trap #2: Incomplete Work"
date = "2019-04-18"
categories = ["go"]
tags = ["concurrency"]
url = "/blog/2019/04/concurrency-trap-2-incomplete-work.html"
author = "jcbwlkr"
description = "One of the traps of concurrency is \"incomplete work\" which occurs when a program terminates before outstanding Goroutines complete. Depending on the program, this may be a serious problem. This post demonstrates the trap and discusses possible solutions."
canonical = "https://www.ardanlabs.com/blog/2019/04/concurrency-trap-2-incomplete-work.html"
+++

This post was originally published on the [Ardan Labs Blog](https://www.ardanlabs.com/blog/2019/04/concurrency-trap-2-incomplete-work.html).

### Introduction

In my first post on [Goroutine Leaks](https://jacob-walker.com/blog/goroutine-leaks-the-forgotten-sender.html), I mentioned that concurrency is a useful tool but it comes with certain traps that don't exist in synchronous programs. To continue with this theme, I will introduce a new trap called incomplete work. Incomplete work occurs when a program terminates before outstanding Goroutines (non-main goroutines) complete. Depending on the nature of the Goroutine that is being terminated forcefully, this may be a serious problem.

### Incomplete Work

To see a simple example of incomplete work, examine this program.

**Listing 1**  
https://play.golang.org/p/VORJoAD2oAh
```go
5 func main() {
6     fmt.Println("Hello")
7     go fmt.Println("Goodbye")
8 }
```

The program in Listing 1 prints `"Hello"` on line 6 and then on line 7, the program calls `fmt.Println` again but does so within the scope of a different Goroutine. Immediately after scheduling this new Goroutine, the program reaches the end of the `main` function and terminates. If you run this program you won't see the "Goodbye" message because in the [Go specification](https://golang.org/ref/spec#Program_execution) there is a rule:

> _"Program execution begins by initializing the main package and then invoking the function `main`. When that function invocation returns, the program exits. It does not wait for other (non-main) goroutines to complete."_

The spec is clear that your program will not wait for any outstanding Goroutines to finish when the program returns from the `main` function. This is a good thing! Consider how easy it is to let a Goroutine leak or have a Goroutine run for a very long time. If your program waited for non-main Goroutines to finish before it could be terminated, it could be stuck in some kind of zombie state and never terminate.

However, this termination behavior becomes a problem when you start a Goroutine to do something important, but the `main` function does not know to wait for it to complete. This type of scenario can lead to integrity issues such as corrupting databases, file systems, or losing data.

### A Real Example

At Ardan Labs, my team built a web service for a client that required certain events to be tracked. The system for recording events had a method similar to the type `Tracker` shown below in Listing 2:

**Listing 2**  
https://play.golang.org/p/8LoUoCdrT7T
```go
 9 // Tracker knows how to track events for the application.
10 type Tracker struct{}
11 
12 // Event records an event to a database or stream.
13 func (t *Tracker) Event(data string) {
14     time.Sleep(time.Millisecond) // Simulate network write latency.
15     log.Println(data)
16 }
```

The client was concerned that tracking these events would add unnecessary latency to response times and wanted to perform the tracking asynchronously. **It is unwise to make assumptions about performance**, so our first task was to measure latency of the service with events tracked in a straight-forward and synchronous approach. In this case, the latency was unacceptably high and the team decided an asynchronous approach was needed. If the synchronous approach was fast enough then this story would be over as we would have moved on to more important things.

With that in mind, the handlers that tracked events were initially written like this:

**Listing 3**  
https://play.golang.org/p/8LoUoCdrT7T
```go
18 // App holds application state.
19 type App struct {
20     track Tracker
21 }
22 
23 // Handle represents an example handler for the web service.
24 func (a *App) Handle(w http.ResponseWriter, r *http.Request) {
25 
26     // Do some actual work.
27 
28     // Respond to the client.
29     w.WriteHeader(http.StatusCreated)
30 
31     // Fire and Hope.
32     // BUG: We are not managing this goroutine.
33     go a.track.Event("this event")
34 }
```

The significant part of the code in listing 3 is line 33. This is where the `a.track.Event` method is being called within the scope of a new Goroutine. This had the desired effect of tracking events asynchronously without adding latency to the request. However, this code falls into the *incomplete work* trap and must be refactored. Any Goroutine created on line 33 has no guarantee of running or finishing. This is an integrity issue as events can be lost when the server shuts down. 

### Refactor For Guarantees 

To avoid the trap, the team modified the `Tracker` type to manage the Goroutines itself. The type uses a `sync.WaitGroup` to keep a count of open Goroutines and provides a `Shutdown` method for the `main` function to call which waits until all Goroutines have finished.

First the handlers were modified to not create Goroutines directly. The only change in Listing 4 is line 53 which no longer includes the `go` keyword.

**Listing 4**  
https://play.golang.org/p/BMah6_C57-l
```go
44 // Handle represents an example handler for the web service.
45 func (a *App) Handle(w http.ResponseWriter, r *http.Request) {
46 
47     // Do some actual work.
48 
49     // Respond to the client.
50     w.WriteHeader(http.StatusCreated)
51 
52     // Track the event.
53     a.track.Event("this event")
54 }
```

Next the `Tracker` type was rewritten to manage Goroutines itself.

**Listing 5**  
https://play.golang.org/p/BMah6_C57-l
```go
10 // Tracker knows how to track events for the application.
11 type Tracker struct {
12     wg sync.WaitGroup
13 }
14 
15 // Event starts tracking an event. It runs asynchronously to
16 // not block the caller. Be sure to call the Shutdown function
17 // before the program exits so all tracked events finish.
18 func (t *Tracker) Event(data string) {
19 
20     // Increment counter so Shutdown knows to wait for this event.
21     t.wg.Add(1)
22 
23     // Track event in a goroutine so caller is not blocked.
24     go func() {
25 
26         // Decrement counter to tell Shutdown this goroutine finished.
27         defer t.wg.Done()
28 
29         time.Sleep(time.Millisecond) // Simulate network write latency.
30         log.Println(data)
31     }()
32 }
33 
34 // Shutdown waits for all tracked events to finish processing.
35 func (t *Tracker) Shutdown() {
36     t.wg.Wait()
37 }
```

In listing 5, line 12 adds a `sync.WaitGroup` to the type definition of `Tracker`. Inside the `Event` method on line 21, `t.wg.Add(1)` is called. This increments the counter to account for the Goroutine that is created on line 24. As soon as that Goroutine is created, the `Event` function returns which is what satisfies the client's requirement of minimizing event tracking latency. The Goroutine that is created does its work and when it's done it calls `t.wg.Done()` on line 27. Calling the `Done` method decrements the counter so the WaitGroup knows this Goroutine has finished.

The calls to `Add` and `Done` are useful for tracking the number of active Goroutines but the program must still be instructed to wait for them to finish. To allow this, the `Tracker` type gains a new method `Shutdown` on line 35. The simplest implementation of this function is to call `t.wg.Wait()`, which blocks until the Goroutine count is reduced to 0. Finally this method must be called from `func main` as in listing 6:

**Listing 6**  
https://play.golang.org/p/BMah6_C57-l
```go
56 func main() {
57 
58     // Start a server.
59     // Details not shown...
60     var a App
61 
62     // Shut the server down.
63     // Details not shown...
64 
65     // Wait for all event goroutines to finish.
66     a.track.Shutdown()
67 }
```

The important part of listing 6 is line 66 which blocks `func main` from terminating until `a.track.Shutdown()` finishes.

### But maybe don't wait too long

The implementation shown for the `Shutdown` method is simple and does the job needed; it waits for the Goroutines to finish. Unfortunately, there is no limit on how long it will wait. Depending on your production environment you might not be willing to wait indefinitely for your program to shut down. To add a deadline to the `Shutdown` method, the team changed it to this:

**Listing 7**  
https://play.golang.org/p/p4gsDkpw1Gh
```go
36 // Shutdown waits for all tracked events to finish processing
37 // or for the provided context to be canceled.
38 func (t *Tracker) Shutdown(ctx context.Context) error {
39 
40     // Create a channel to signal when the waitgroup is finished.
41     ch := make(chan struct{})
42 
43     // Create a goroutine to wait for all other goroutines to
44     // be done then close the channel to unblock the select.
45     go func() {
46         t.wg.Wait()
47         close(ch)
48     }()
49 
50     // Block this function from returning. Wait for either the
51     // waitgroup to finish or the context to expire.
52     select {
53     case <-ch:
54         return nil
55     case <-ctx.Done():
56         return errors.New("timeout")
57     }
58 }
```

Now in Listing 7 on line 38 the `Shutdown` method takes a `context.Context` as input. This is how the caller will limit the time that `Shutdown` is allowed to wait. In the function on line 41, a channel is created and then on line 45 a Goroutine is launched. This new Goroutine's only job is to wait for the WaitGroup to finish and then close the channel. Finally line 52 starts a `select` block which waits for either the context to be canceled or the channel to be closed.

Next the team changed the call in `func main` to this:

**Listing 8**  
https://play.golang.org/p/p4gsDkpw1Gh
```go
86     // Wait up to 5 seconds for all event goroutines to finish.
87     const timeout = 5 * time.Second
88     ctx, cancel := context.WithTimeout(context.Background(), timeout)
89     defer cancel()
90 
91     err := a.track.Shutdown(ctx)
```

In listing 8 a context is created in the `main` function with a 5 second timeout. This is passed to `a.track.Shutdown` to set the limit on how long `main` is willing to wait.

### Conclusion

With the introduction of Goroutines, the handlers for this server were able to minimize the latency cost for API clients that needed to track events. It would have been easy to just use the `go` keyword to run this work in the background but that solution has integrity issues. Doing this properly requires putting in the effort to ensure all relevant Goroutines have terminated before letting the program shut down.

_**Concurrency is a useful tool, but it must be used with caution.**_
