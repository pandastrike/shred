Testify = require "testify"
assert = require "assert"
{type} = require "fairmont"
{resolve} = require "path"
{resource} = require "../src/shred.coffee"

Testify.test "Resource", (context) ->
  context.test "Creating a resource from a URL", (context) ->
    github = resource "https://api.github.com/"
    assert.equal github.describe?, true
    github.events.on "error", (error) -> console.log error

    context.test "creating a resource from a resource", (context) ->
      issues = github.resource "repos/pandastrike/shred/issues"
      assert.equal issues.describe?, true

      context.test "describing resource actions", (context) ->

        issues.describe
          list:
            method: "get"
            headers:
              accept: "application/vnd.github.v3.raw+json"
            expect: 200

        assert.equal issues.list?, true

        context.test "invoking resource actions", (context) ->
          issues.list()
          .on "ready", (issues) ->
            assert.equal type(issues), "array"
            context.pass()

        context.test "creating a resource from a query", (context) ->
          milestone  = issues.query
            milestone: 1
            status: "open"

          milestone.list()
          .on "ready", (issues) ->
            assert.equal type(issues), "array"
            context.pass()

  context.test "Automatically decode Gzipped responses", (context) ->
      site = resource "http://pandastrike.com"
      .describe
        get:
          method: "get"
          headers:
            accept: "text/html"
            "accept-encoding": "gzip"
          expect: 200
      site.get()
      .on "ready", (html) ->
        assert.equal type(html), "string"
        context.pass()
