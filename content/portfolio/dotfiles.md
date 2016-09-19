+++
title = "My Dotfiles"
weight = 170
categories = ["bash", "vim"]

+++

[source]: https://github.com/jcbwlkr/mydotfiles
[homesick]: https://github.com/technicalpickles/homesick

It seems like every \*nix developer hosts at least their bashrc file on GitHub
and I am no exception. My repo uses the Ruby gem [homesick][homesick] to easily
keep my config files in sync.

<!--more-->

To further ease the process I can install or update my config by running

```bash
bash <( curl -L http://bit.ly/jacobwalker )
```

The installation script is Linux specific and hasn't been updated in a
while.

Key features of my dotfiles include my vim, zsh, and tmux configs.

* [My Dotfiles on GitHub][source]
