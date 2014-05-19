# Overview

Shred is an HTTP client that wraps HTTP interfaces so you can easily create CoffeeScript or JavaScript clients.

**Note** Shred 1.0.x is a complete reboot of the project. The goal is the same, but the interface has changed drastically. Shred 1.0.x is _not_ backwards compatible with earlier versions.

HTTP is a rich protocol, but the low-level details of setting headers and checking response codes muck up our code. So we either ignore these nuances or write wrapper functions to hide the details.

Shred makes it easy to declaratively create API wrapper functions. Shred also features support for URL templates, response compression, authorization, and streaming responses. And more features are coming soon!

## Example: GitHub API

Here's how we would access the issues for the Shred project on Github:

```coffeescript
{resource} = require "shred"
{base64, read} = require "fairmont"

# read our personal github token from a file
token = read(resolve(__dirname, "token")).trim()

# define our API client
github = resource "https://api.github.com/",
  issues: (resource) ->
    resource "repos/{owner}/{repo}/issues",
      create:
        method: "post"
        headers:
          accept: "application/vnd.github.v3.raw+json"
        expect: 201
      list:
        method: "get"
        headers:
          accept: "application/vnd.github.v3.raw+json"
        expect: 200

# later, use the API client -- here, we'll just list some issues
github
.on "error", (error) ->
  console.log error
.issues owner: "pandastrike", repo: "shred"
.list()
.on "ready", (issues) ->
  for {number, title} in issues
    console.log number, title


# let's create a new ticket...
# this requires authorization
github
.issues owner: "pandastrike", repo: "shred"
.create
.authorize basic: { username: token, password: ""}
.invoke
  title: "Create a Shred T-shirt Design"
  body: "We need a cool logo so we can go into the
    T-shirt business like Docker."
  labels: [ "ng" ]

```

# Install

<del>`npm install shred`</del>

The 1.0.x version of Shred is not yet available as an NPM. You'll have to `git clone` it and then `npm link` to it.

# Introduction

Shred exports one function: `resource`. That's it.

The `resource` function takes a URL and an optional interface and returns a resource. Resources, in turn, are objects, imbued with the interface you specify, that can also be invoked as functions to create subsidiary resources.

Let's start with a simple example. Let's just create a resource for the github API:

```coffeescript
github = resource "api.github.com"
```

By itself, that isn't very useful. But we can create a subsidiary resource for a repo:

```coffeescript
shred_repo = github "repos/pandastrike/shred"
```

That's still not very useful, because we haven't provided our resource with an interface. But it illustrates the idea that resources are functions that generate subsidiary resources.

Let's create an interface for listing issues in our repo:

```coffeescript
shred_issues = shred_repo "issues",
  list:
    method: "get"
    headers:
      accept: "application/vnd.github.v3.raw+json"
    expect: 200
```

This imbues our new resource with an interface with one method: `list`. We've described that method based on Github's API docs. So now we can just call it like an ordinary method:

```coffeescript
shred_issues.list()
.on "success", (response) ->
  # do something with the response
.on "error", (error) ->
  # do something with the error
```

That's nice, but it's a bit tedious if we have to do this every time we want to look at the issues for a new repo. We can use URI templates ([RFC 6570][1]) to make this easier to do.

```coffeescript
repo = github "repos/{owner}/{repo}"

shred_repo = repo owner: "pandastrike", repo: "shred"
```

[1]:http://tools.ietf.org/html/rfc6570

## Initializer Functions

So that's nice, but we can do even better. We can decorate the `github` resource with this `repo` property, instead of having to define it separately. Instead of defining a description of a request, we simply provide an initializer function. The return value of the initializer function is the property's value.

```coffeescript
github = resource "api.github.com",
  repo: (resource) ->
    resource "repos/{owner}/{repo}"

shred_repo = github.repo owner: "pandastrike", repo: "shred"
```

## Nested Interfaces

In this case, we've defined the `repo` method to be our repo resource, which we can now call as a method on the `github` resources.

We nest these definitions. Let's add the issues resource:

```coffeescript
github = resource "api.github.com",
  repo: (resource) ->
    resource "repos/{owner}/{repo}/",
      issues: (resource) ->
        resource "issues",
          list:
            method: "get"
            headers:
              accept: "application/vnd.github.v3.raw+json"
            expect: 200

shred_repo = github.repo owner: "pandastrike", repo: "shred"
shred_repo.issues.list()
.on "success", (response) ->
  # do something with the response
.on "error", (error) ->
  # do something with the error

```

In short, we've basically created Github client that we can now use however we please. Of course, it's not terribly useful because it only lets us list the issues of a repo. We'd have to add more methods to make it truly useful.

Still, it's a very convenient interface and it's easy to see how we can describe any API this way.

## Default Error Handlers

Subordinate resources propagate success and error events up to their parent resources. So we can add a default error handler to our top-level resource and simplify the logic in the rest of code.

```coffeescript
github = resource "api.github.com",
  repo: (resource) ->
    resource "repos/{owner}/{repo}/",
      issues: (resource) ->
        resource "issues",
          list:
            method: "get"
            headers:
              accept: "application/vnd.github.v3.raw+json"
            expect: 200
.on "error", (error) -> console.error error

github
.repo owner: "pandastrike", repo: "shred"
.issues
.list()
# we don't need an error handler here unless we're going to do
# something more interesting than the default...
.on "success", (response) ->
  # do something with the response
```

## The `ready` Event

Sometimes, we don't want to have to parse the body response ourselves. Shred gives us a `ready` event to use when the response body is ready. In fact, if the content type is JSON-based, Shred parses it for you.

```coffeescript
github
.repo owner: "pandastrike", repo: "shred"
.issues
.list()
.on "ready", (issues) ->
  console.log number, title for {number, title} in issues
