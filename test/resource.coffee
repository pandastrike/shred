Testify = require "testify"
assert = require "assert"
{type} = require "fairmont"

{resource} = require "../src/resource.coffee"

Testify.test "Resource", (context) ->
  context.test "Creating a resource", (context) ->
    target = resource "http://google.com"
    target.events.on "error", (error) -> console.log error
    assert.equal type(target), "function"
    assert.equal target.url, "http://google.com"

    context.test "which has resource methods", (context) ->
      assert.equal type(target.get), "function"
      assert.equal type(target.get.describe), "function"
      assert.equal target.get.method, "get"

      context.test "which can be described", (context) ->
        target.get.describe
          headers:
            accept: "text/html"
          expect: 200
        assert.equal target.get.headers.accept, "text/html"

        context.test "and invoked as HTTP request", (context) ->
          target.get().on "success", (response) ->
            assert.equal response.statusCode, 200
          .on "ready", (body) ->
            context.pass()
