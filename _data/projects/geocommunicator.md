I have a friend who travels around the mid-west servicing natural gas
pipelines. As part of his duties he has to translate latitude / longitude
coordinates into state, township, range, and section information. He was doing
this by hand dozens of time per day. I found an API from the [Departartment of
the Interior's Bureau of Land Management][blm] which accepts coordinates and
responds with the exact information my friend needed. I created a client class
that can consume the API and another class that uses [PHPExcel][phpexcel] to
parse an XLS spreadsheet with coordinates and populate it with the additional
information.

[Source][source]

[source]: https://github.com/jacobwalker0814/geocommunicator-client
[phpexcel]: http://phpexcel.codeplex.com/
[blm]: http://www.geocommunicator.gov/
