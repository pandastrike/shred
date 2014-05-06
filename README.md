# Introduction

Shred is an HTTP client that wraps HTTP interfaces so you can easily create JavaScript clients. No one wants the low-level details of HTTP calls mucking up their code. So what do we typically do? We wrap the calls in functions. Shred just makes that easier.

## Example: GitHub API

Here's how we would access the issues for the Shred project on Github:

    {resource, method} = require "shred"
    github = resource "https://api.github.com/"
    issues = resource github, "repos/pandastrike/shred/issues"
    issues.list = method issues,
      method: "get"
      headers:
        accept: "application/vnd.github.v3.raw+json"
      expect: 200

    shred.issues.list()
    .on "ready", (issues) ->
      for issue in issues
        console.log issue.id, issue.title

That might seem like a lot of work just to make a `GET` request, but we can describe the entire API in this fashion in one place, and then, from that point on, call it using our wrapper.
