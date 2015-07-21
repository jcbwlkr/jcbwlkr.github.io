In Go web development the [Gorilla web toolkit][gorilla] is a very popular
collection of libraries for common web tasks. The `gorilla/sessions` package
provides an easy interface for using/storing users' session data. The package
itself relies on implementations of its storage interface so developers can
store the data in whatever place is best for their environment.

For an application we were prototyping at work we elected to store everything
in [Cassandra DB][cassandra]. There was no implementation for using
`gorilla/sessions` with Cassandra so I created one.

* [Source][github]
* [Documentation][documentation]

[gorilla]: http://www.gorillatoolkit.org/
[cassandra]: http://cassandra.apache.org/
[github]: https://github.com/jcbwlkr/cqlstore
[documentation]: https://godoc.org/github.com/jcbwlkr/cqlstore
