+++
categories = ["bash", "vim"]
date = "2016-10-04T14:27:34-05:00"
tags = ["tmux"]
title = "Taming tmux: Find One Process Among Many Windows"

+++

[tmux]: https://tmux.github.io/

I'm a big fan of [tmux][tmux] and I use it daily. Over time I will open more
and more windows and my workspace starts to get a bit cluttered. Occasionally I
will try to open some file in vim that is already open in another window. I
used to dread playing "find the right window" especially if I had backgrounded
vim in some window. This happened often enough that I spent the time to come up
with a little tmux keybinding to find that window automatically.

<!--more-->

## The problem

Vim users will be used to seeing this screen and may even dread it.

```none
E325: ATTENTION
Found a swap file by the name "~/.vim/swaps/foo.txt.swp"
          owned by: jwalker   dated: Wed Oct  5 18:10:25 2016
         file name: ~jwalker/foo.txt
          modified: no
         user name: jwalker   host name: jacobs-mbp
        process ID: 79121 (still running)
While opening file "foo.txt"
             dated: Wed Oct  5 18:10:25 2016

(1) Another program may be editing the same file.  If this is the case,
    be careful not to end up with two different instances of the same
    file when making changes.  Quit, or continue with caution.
(2) An edit session for this file crashed.
    If this is the case, use ":recover" or "vim -r foo.txt"
    to recover the changes (see ":help recovery").
    If you did this already, delete the swap file "/Users/jwalker/.vim/swaps/foo.txt.swp"
    to avoid this message.

Swap file "~/.vim/swaps/foo.txt.swp" already exists!
[O]pen Read-Only, (E)dit anyway, (R)ecover, (Q)uit, (A)bort:
```

Do you see the line that says `process ID: 79121`? That gives us the process id
(pid for short) of the `vim` process that's editing this file. What we'll do
is take that pid and ask tmux to find it for us.

## The solution

Add this to your `~/.tmux.conf` file (and reload the config if necessary)

```none
bind-key W command-prompt -p "Switch to pane with pid:" "run-shell 'pane=\$(ps eww %% | sed \"1d; s/^.*TMUX_PANE=//;s/ .*//\"); [[ -z \$pane ]] && tmux display-message \"could not find pid\" || tmux switch-client -t \$pane'"
```

With that in our config and knowing the pid we want to find we hit
<kbd>prefix</kbd> <kbd>W</kbd>. Prefix defaults to <kbd>ctrl-b</kbd> and I
chose capital <kbd>W</kbd> because I remember this command as `Where` and
<kbd>w</kbd> was already taken. When we do this our tmux will prompt `Switch to
pane with pid:` so we'll type in <kbd>79121</kbd> <kbd>enter</kbd> and tmux
automatically switches to the right window even in another session. How cool!
Let's see it in action!

<div class="text-center">
  <img class="img-responsive img-thumbnail" alt="finding tmux window containing pid" src="https://cldup.com/pDEQFB-8Iy.gif" />
</div>

## Break it down now

Let's unravel this a bit to see the different pieces. It's all one on line and
there is a lot of escaping going on because it's a script within a script
within a string... but if we split it up it's not hard to follow.

First our key binding runs the tmux command `command-prompt` with two
arguments: the prompt to display to the user and the tmux command to run. That
command is `run-shell` and the argument we pass to that is the shell script.

The script first runs `ps eww %%`. The `%%` gets replaced with whatever you
typed in the command prompt so in our example it becomes `ps eww 79121`. Now
`ps` is a tool that inspects the process list for information. The flag `e`
causes it to include the environment variables that were present when the
process launched and the flags `ww` improve the formatting a bit (and help for
parsing on ubuntu). The `ps` tool accepts different flags and in different
styles; this is the BSD format which works on a Mac and seems to be supported
by most Linux distros as well. Providing the pid as an argument limits the
output to just the process we care about. That command gives output that looks
like this (abbreviated a bit for this post)

```none
  PID   TT  STAT      TIME COMMAND
79121 s021  S+     0:00.58 vim foo.txt TERM=screen-256color USER=jwalker PAGER=less EDITOR=/usr/local/bin/vim LANG=en_US.UTF-8 LC_CTYPE=en_US.UTF-8 TMUX_PANE=%115 PWD=/Users/jwalker SHELL=/bin/zsh
```

So we can see the process in question and we can see its environment variables.
The one we care about is called `TMUX_PANE`. Every time you open a new window
or split a window the tmux daemon assigns that pane a unique id and sets it in
this environment variable `TMUX_PANE`. That is the secret that is going to make
this all work but we need to extract it.

The next step of the script is to pipe the output of `ps` to `sed` with a
little sed script that first deletes the header line and then deletes
everything up to and including `TMUX_PANE=` and then deletes everything after
the value. At this point all we're left with is the value we want which is
`%115`.

Both the `ps` and `sed` commands were ran in a subshell `$()` and the final
output is assigned to the variable `pane`. Next we do an evaluation to see if
`pane` is empty (perhaps we mistyped the pid). We use `[[ -z $pane ]]` which
will succeed if it is empty. In that case we run `tmux display-message "could
not find pid"` and we're done.

If `pane` was not empty we run `tmux switch-client -t $pane`. That command
instructs the client to switch to the pane with id `%115`.

## In conclusion

I hope this little script makes your tmux experience a little better. I don't
use it every day myself but when it comes up I am glad to have it. I would also
like to point out that although I used a vim process in my example there's
nothing really vim specific about this tip. You could use this command to
switch to the pane running any process.
