+++
date = 2013-01-06
title = "PHP Clone and Shallow vs Deep Copying"
tags = ["php"]
+++

Looking through the [PHPExcel](https://github.com/PHPOffice/PHPExcel) library
recently I saw how Mark Baker overrides the magic `__clone` method with
comments about ensuring that cloning will perform a deep copy instead of a
shallow one. This is a topic with which I had not had much experience so I did
some research and experimenting to learn what happens when you use `clone` and
the difference between a shallow copy and a deep copy.

<!--more-->

First I examined how you might copy variables in general. Let's start with the
basics.

```php
// Example 1
$foo = 1;
$bar = $foo; // Copy by value
++$bar;
print $bar; // Outputs 2
print $foo; // Outputs 1
```

`$bar` is a copy of `$foo`. Incrementing `$bar` has no effect on `$foo`. If we
wanted different behavior we would need to copy by reference with the use of an
ampersand.

```php
// Example 2
$foo = 1;
$bar =& $foo; // Copy by reference
++$bar;
print $bar; // Outputs 2
print $foo; // Outputs 2
```
Now when we increment `$bar` we are also incrementing `$foo`. Well, not really.
`$foo`, the variable, is a handle or reference to where the data is stored in
memory. In the first example we copy by value which (more or less) makes a new
entry in memory and `$bar` is a handle to that new location. In the second
example `$bar` simply copies the handle. There is only one entry in memory and
both `$foo` and `$bar` point to the same location. What we are actually doing
when we increment `$bar` is incrementing the data referenced by `$bar`. `$foo`
references the same data.

Next I looked at how to copy objects. I started with this simple class Project.

```php
<?php

class Project {
    protected $description;

    public function setDescription($description) {
        $this->description = $description;

        return $this;
    }

    public function getDescription() {
        return $this->description;
    }
}
```

I repeated the same copy assignment from Example 1.

```php
$project_one = new Project();
$project_one->setDescription("This is my first test project");
$project_two = $project_one; // Copying by value?
```

In the previous examples we would have two completely distinct variables that
reference two different addresses in memory. So to see if this holds true we
can make a change in `$project_two` and see the impact.

```php
$project_two->setDescription("A new description for my copied project");
print $project_one->getDescription();
```

Based on Example 1 we might expect that this would print the original
description we set in `$project_one`. In fact, it will actually print the new
description. It appears that the objects are copied by reference. One of the
things you will often hear is that in PHP 5 objects are copied by reference by
default. Some research shows that isn't quite true either. Consider this
explanation from
[PHP.net](http://php.net/manual/en/language.oop5.references.php)

> A PHP reference is an alias, which allows two different variables to write to
> the same value. As of PHP 5, an object variable doesn't contain the object
> itself as value anymore. It only contains an object identifier which allows
> object accessors to find the actual object. When an object is sent by
> argument, returned or assigned to another variable, the different variables
> are not aliases: they hold a copy of the identifier, which points to the same
> object.

This means copying an object by value will copy the identifier... by value.
This behaves very similarly to copying by reference because the copied
identifier points to the same object but is not exactly the same. For a more
detailed explanation of the difference you can visit the source link.

So what if you don't want this behavior? Here enters the `clone` keyword.

```php
$project_one = new Project();
$project_one->setDescription("This is my first test project");
$project_two = clone $project_one; // Cloning to get a new object
```

Now $project_two is a clone of `$project_one` and is its own honest object.
When we repeat the test with the descriptions we will see that monkeying around
with `$project_two`'s description has no effect on `$project_one`.

What happens if the property of a Project is another object? To test this I
created a new class Person and modified Project to hold a Person
```php
<?php

class Person {
    protected $name;

    public function setName($name) {
        $this->name = $name;

        return $this;
    }

    public function getName() {
        return $this->name;
    }
}
```

```php
<?php

class Project {
    protected $leadDeveloper;

    public function setLeadDeveloper(Person $developer) {
        $this->leadDeveloper = $developer;

        return $this;
    }

    public function getLeadDeveloper() {
        return $this->leadDeveloper;
    }
}
```

I then made a Project and set its Lead Developer.
```php
$jacob = new Person();
$jacob->setName("Jacob");

$project_one = new Project();
$project_one->setLeadDeveloper($jacob);
$project_two = clone $project_one;

$matthew = new Person();
$matthew->setName("Matthew");
$project_two->setLeadDeveloper($matthew);

print $project_one->getLeadDeveloper()->getName(); // Outputs "Jacob"
```

As `$project_two` is a clone, setting a new value for
`$project_two->leadDeveloper` did not change `$project_one`. Great, right?
Let's look at this from a different angle.

```php
$jacob = new Person();
$jacob->setName("Jacob");

$project_one = new Project();
$project_one->setLeadDeveloper($jacob);
$project_two = clone $project_one;

$project_two->getLeadDeveloper()->setName("Matthew");

print $project_one->getLeadDeveloper()->getName(); // Outputs "Matthew"
```

The plot thickens. Here we can see that `$project_one->leadDeveloper` and
`$project_two->leadDeveloper` both point to the same object. $project_one
and $project_two are both unique objects but they do not have unique values for
properties that are references or object identifiers. This is what is meant by
a shallow copy. If we wanted the two projects to be completely separate we
would need to change the default behavior of clone to perform a deep copy
instead of a shallow copy. To do this I define the magic `__clone` method.

```php
class Project {
    // Snip properties, getters, and setters

    public function __clone() {
        $this->leadDeveloper = clone $this->leadDeveloper;
    }
}
```
After PHP clones an object it will attempt to call the `__clone` method on
**the new cloned object**. Now when we perform the previous test we can see
that `$project_one->leadDeveloper` and `$project_two->leadDeveloper`
point to two completely different objects. This is a deep copy.

Note that a common technique for ensuring a deep copy is to serialize then
immediately unserialize each of a class's object properties. Take for example
this code from PHPExcel

```php
public function __clone() {
    foreach($this as $key => $val) {
        if (is_object($val) || (is_array($val))) {
            $this->{$key} = unserialize(serialize($val));
        }
    }
}
```
This method forces PHP to split apart any object properties from their
references and return new instances.

Additional information and examples about cloning can be found on
[php.net](http://php.net/manual/en/language.oop5.cloning.php)
