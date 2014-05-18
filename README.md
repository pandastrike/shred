# Introduction

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
  issues: ({path}) ->
    path "repos/{owner}/{repo}/issues",
      for: ({expand}) ->
        expand
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
.issues
.for(owner: "pandastrike", repo: "shred")
.list()
.on "ready", (issues) ->
  for {number, title} in issues
    console.log number, title


# let's create a new ticket...
# this requires authorization
github
.issues
.for
  owner: "pandastrike"
  repo: "shred"
.create
.authorize basic: { username: token, password: ""}
.invoke
  title: "Create a Shred T-shirt Design"
  body: "We need a cool logo so we can go into the
    T-shirt business like Docker."
  labels: [ "ng" ]

```

# Install

`npm install shred`
