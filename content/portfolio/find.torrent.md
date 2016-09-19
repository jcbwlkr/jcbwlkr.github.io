+++
title = "find.torrent"
weight = 90
categories = ["php"]
tags = ["rest", "api", "tdd"]

+++

At home my desktop PC acts as a UPNP media server and is the box I use to
download torrents. This machine was inconveniently located in my basement. There
were many times when I would want to start a download but the only device
nearby is my phone. I found that finding and downloading a torrent file then
getting it to my torrent machine was a cumbersome process. Furthermore, many
sites that index torrent files contain advertising that ranges from annoying to
inappropriate to explicit. I decided to create a service that facilitates the
process of finding the `.torrent` files and triggering their download. The
service does not download the torrent itself; just the torrent file.

When I started this project I knew that I wanted to build the service as a REST
API that I could then consume through various clients. I intend to develop web,
command line, Android, and iOS applications. The service was written in [Bullet
PHP][bullet] and serves the API with the [HAL Hypermedia Type][hal]. The
service was developed using a combination of TDD and BDD practices with tests in
PHPUnit and Frisby.js.

This is a collaborative work with my friend [Matthew M. Keeler][matthew].

[Source][source]

[source]: https://github.com/Tortugas-Consulting-LLC/find.torrent
[matthew]: http://cupfullofcode.com
[bullet]: http://bulletphp.com/
[hal]: http://stateless.co/hal_specification.html
