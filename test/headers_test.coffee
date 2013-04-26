Testify = require "testify"
assert = require "assert"
Headers = require("../src/shred/mixins/headers")

class HeaderUser
  constructor: ->

Headers.gettersAndSetters(HeaderUser)


Testify.test "Headers mixin", (context) ->

  context.test "setHeader and getHeader", (context) ->

    context.test "setHeader and getHeader with correctly cased names", ->
      object = new HeaderUser()
      object.setHeader "Content-Type", "text/html"
      assert.equal object.getHeader("Content-Type"), "text/html"

    context.test "setHeader with downcased name, getHeader with correct name", ->
      object = new HeaderUser()
      object.setHeader "content-type", "text/html"
      assert.equal object.getHeader("Content-Type"), "text/html"

    context.test "setHeader with correct name, getHeader with downcased name", ->
      object = new HeaderUser()
      object.setHeader "Content-Type", "text/html"
      assert.equal object.getHeader("content-type"), "text/html"

  context.test "setHeaders and getHeaders", (context) ->

    context.test "Setting multiple headers", ->
      object = new HeaderUser()
      object.setHeaders
        "Content-Type": "text/html"
        "Accept": "text/html"
        "Host": "foobar.com"
      assert.equal object.getHeader("Host"), "foobar.com"
      assert.equal object.getHeader("Accept"), "text/html"
      assert.equal object.getHeader("Content-Type"), "text/html"

    context.test "Getting multiple headers", ->
      object = new HeaderUser()
      object.setHeaders
        "Content-Type": "text/html"
        "Accept": "text/html"
        "Host": "foobar.com"

      assert.deepEqual object.getHeaders("Host", "Accept", "Content-Type"),
        "Content-Type": "text/html"
        "Accept": "text/html"
        "Host": "foobar.com"


