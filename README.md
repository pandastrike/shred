# Introduction

Shred is an HTTP client that wraps HTTP interfaces so you can easily create JavaScript clients. No one wants the low-level details of HTTP calls mucking up their code. So what do we typically do? We wrap the calls in functions. Shred just makes that easier.

## Example: GitHub API

Here's how we would access the issues for the Shred project on Github:

```coffeescript
{resource} = require "shred"
{base64, read} = require "fairmont"

# read our personal github token from a file
token = read(resolve(__dirname, "token")).trim()

# create the main github API resource
github = resource "https://api.github.com/"

# provide top-level event handler
github.events
.on "error", (error) -> console.log error

# create the issues resource, with some actions
issues = github.resource "repos/pandastrike/shred/issues"
.describe
  list:
    method: "get"
    headers:
      accept: "application/vnd.github.v3.raw+json"
    expect: 200
  create:
    method: "post"
    headers:
      authorization: "Basic " +
        base64("#{token}:")
      accept: "application/vnd.github.v3.raw+json"
    expect: 201

# create a new ticket...
issues.create
  title: "Create a Shred logo"
  body: "We need a cool logo so we can go into the
    T-shirt business like Docker."
  labels: [ "ng" ]

issues.list()
.on "ready", (issues) ->
  for issue in issues
    console.log issue.number, issue.title
```

Basically, the idea is that we can describe an API in one place and we now have a simple JavaScript client we can use wherever.

# Install

`npm install shred`
