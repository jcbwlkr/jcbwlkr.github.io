[pysag](pysag) is a tool I am developing for generating static web apps. It
differs from other (great) static site generators like Jekyll by being focused
on data first and pages second.

The user defines their data such as blog posts, employees, or products in the
filesystem as yaml files. This data is first converted to json files to
generate a read-only "API". The ideal usecase here is a JavaScript application
to render the data. Properties of the yaml files can be paths to
[Markdown](markdown) files for easy authoring. If desired the data can be fed
to [Jinja2](jinja2) templates to create true static pages.

Check out the README on [GitHub](pysag) for a better description.

[pysag]: https://github.com/jacobwalker0814/pysag
[jinja2]: http://jinja.pocoo.org/docs/dev/
[markdown]: https://pypi.python.org/pypi/Markdown
