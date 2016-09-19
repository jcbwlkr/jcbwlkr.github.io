+++
title = "cqlstore"
weight = 17
categories = ["go"]

+++

[gorilla]: http://www.gorillatoolkit.org/
[cassandra]: http://cassandra.apache.org/
[github]: https://github.com/jcbwlkr/cqlstore
[documentation]: https://godoc.org/github.com/jcbwlkr/cqlstore

In Go web development the [Gorilla web toolkit][gorilla] is a very popular
collection of libraries for common web tasks. The `gorilla/sessions` package
provides an easy interface for using/storing users' session data. There was no
implementation for [Cassandra DB][cassandra] so I created one.

<!--more-->

The `gorilla/sessions` package itself relies on implementations of its storage
interface so developers can store the data in whatever place is best for their
environment. For an application we were prototyping at work we elected to store
everything in [Cassandra DB][cassandra]. I created the session store and it
worked well enough for our prototype. We elected not to use Cassandra for
staffing reasons so my storage implementation never saw production use.

* [Source][github]
* [Documentation][documentation]
