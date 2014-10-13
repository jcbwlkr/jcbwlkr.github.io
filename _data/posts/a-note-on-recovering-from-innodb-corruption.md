InnoDB is a great storage engine for MySQL offering, among other things,
transaction support. One of its drawbacks is the difficulty that you can face
when corruption inevitably hits.

At work we have dealt with corrupt InnoDB tables often enough to make the
procedure fairly routine. Last week I was faced with a situation that had me
pulling my hair out; in fact we almost threw in the towel.

In this particular instance I was connecting to the database with the standard
command line client `mysql`. Every time I ran any query (against the corrupt
table or not) I was slapped in the face with the annoying "MySQL Server Has
Gone Away" message. Even queries like `SHOW PROCESSLIST;` would trigger the
problem.

Right before we gave up I had an idea. When you start the client it gives you
the following message:

    Reading table information for completion of table and column names
    You can turn off this feature to get a quicker startup with -A

What this means is that the client looks up meta information about the tables
and columns in your selected database so that when you hit <kbd>TAB</kbd> it
will auto fill the table names like you would get on the command line. The list
of tables and columns is rebuilt any time you change databases or issue the
`REHASH;` command.

On a hunch I tried starting the client with the <span class="code">-A</span>
flag to prevent this table scanning. I don't know the technical reason within
MySQL's binaries but with this option enabled my problem went away. I can only
assume that when the client scans the tables (including the corrupt table)
something goes horribly wrong.

So just file that away in your DBA utility belt :)
