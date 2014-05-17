# Introduction

Shred is an HTTP client that wraps HTTP interfaces so you can easily create CoffeeScript or JavaScript clients.

HTTP is a rich protocol, but the low-level details of setting headers and checking response codes muck up our code. So we either ignore these nuances or write wrapper functions to hide the details.

Shred makes it easy to declaratively create API wrapper functions. Shred also features support for URL templates, response compression, authorization, and streaming responses. And more features are coming soon!

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
# we define the path as a template, to be expanded later
issues = github.path "repos/{owner}/{repo}/issues"
.describe
  list:
    method: "get"
    headers:
      accept: "application/vnd.github.v3.raw+json"
    expect: 200
  create:
    method: "post"
    headers:
      accept: "application/vnd.github.v3.raw+json"
    expect: 201

# list the existing tickets
issues
.expand
  owner: "pandastrike"
  repo: "shred"
.list()
.on "ready", (issues) ->
  for issue in issues
    console.log issue.number, issue.title

# create a new ticket...
# this requires authorization
issues
.expand
  owner: "pandastrike"
  repo: "shred"
.create
.authorize basic: { username: token, password: ""}
.request
  title: "Create a Shred T-shirt Design"
  body: "We need a cool logo so we can go into the
    T-shirt business like Docker."
  labels: [ "ng" ]

```

# Install

`npm install shred`
