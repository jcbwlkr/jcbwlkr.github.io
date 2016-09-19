+++
title = "httpmatchers"
weight = 18
categories = ["go"]

+++

[ginkgo]: http://onsi.github.io/ginkgo/
[gomega]: http://onsi.github.io/gomega/
[github]: https://github.com/jcbwlkr/httpmatchers
[documentation]: https://godoc.org/github.com/jcbwlkr/httpmatchers

BDD in Go is made easier using the [Ginkgo][ginkgo] and [Gomega][gomega]
packages. Gomega specifically provides a collection of matchers for asserting
that results match expectations. When using these tools to test an API I was
developing I noticed some common patterns appearing around the assertion of
HTTP status codes. I created the `github.com/jcbwlkr/httpmatchers` package to
simplify some of those patterns.

<!--more-->

Since writing this I hame moved to just using the standard `testing` library. I
still appreciate the value from `ginkgo` and `gomega` and would use the library
again if I was working on a project using that testing framework.

* [Source][github]
* [Documentation][documentation]
