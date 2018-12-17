+++
title = "pysag"
weight = 30
categories = ["python"]
tags = ["jinja2"]

+++

[hugo]: https://gohugo.io
[pysag]: https://github.com/jcbwlkr/pysag
[jinja2]: http://jinja.pocoo.org/docs/dev/
[markdown]: https://pypi.python.org/pypi/Markdown

[pysag][pysag] is a tool I developed for generating static web apps. It differs
from other (great) static site generators like Jekyll by being focused on data
first and pages second.

<!--more-->

The user defines their data such as blog posts, employees, or products in the
filesystem as yaml files. This data is first converted to json files to
generate a read-only "API". The ideal usecase here is a JavaScript application
to render the data. Properties of the yaml files can be paths to
[Markdown][markdown] files for easy authoring. If desired the data can be fed
to [Jinja2][jinja2] templates to create true static pages.

Check out the [README][pysag] on GitHub for a better description.

I ended up abandoning this project in favor of [Hugo][hugo]. It was a neat idea
and a fun experience but ultimately Hugo won out for me :)
