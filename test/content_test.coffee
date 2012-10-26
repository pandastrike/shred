Testify = require "testify"
assert = require "assert"
Content = require "../lib/shred/content"


Testify.test "Content constructor", (context) ->

  context.test "An instance constructed with body but no type", (context) ->

    content = new Content(body: "Hello")

    context.test "has default type of test/plain", ->
      assert.equal(content.type, "text/plain")

    context.test "has a data property equal to the body", ->
      assert.equal(content.data, content._body)

    context.test "has a length property equal to body's length", ->
      assert.equal(content.length, content._body.length)


  context.test "An instance constructed with body and type 'text/html'", (context) ->

    content = new Content(type: "text/html", body: "Hello")

    context.test "has the correct type", ->
      assert.equal(content.type, "text/html")

    context.test "has a data property equal to the body", ->
      assert.equal(content.data, content.body)

    context.test "has a length property equal to body's length", ->
      assert.equal(content.length, content.body.length)


  context.test "An instance constructed with an Object and no type", (context) ->

    content = new Content(data: {foo: "Hello"})

    context.test "has a type of application/json", ->
      assert.equal(content.type, "application/json")

    context.test "has a body equal to the JSON form of the data", ->
      assert.equal(content.body.constructor, String)
      assert.equal(content.body, JSON.stringify(content.data))

    context.test "has a length property equal to body's length", ->
      assert.equal(content.length, content.body.length)


  context.test "An instance constructed with an Object and type application/json", (context) ->

    content = new Content
      type: "application/json"
      data: {foo: "Hello"}

    context.test "has a body equal to the JSON form of the data", ->
      assert.equal(content.body.constructor, String)
      assert.equal(content.body, JSON.stringify(content.data))

    context.test "has a length property equal to body's length", ->
      assert.equal(content.length, content.body.length)


  context.test "An instance constructed with a String and type application/json", (context) ->

    data = JSON.stringify({foo: "Hello"})
    content = new Content
      type: "application/json"
      body: data

    context.test "has a body equal to the data", ->
      assert.equal(content.body.constructor, String)
      assert.equal(content.body, data)

    context.test "has a length property equal to body's length", ->
      assert.equal(content.length, content.body.length)


  context.test "An instance constructed with composite media-type", (context) ->

    content = new Content
      type: "application/vnd.foo.bar+json;version=1.1"
      data: {foo: "Hello"}

    context.test "has a body equal to the JSON form of the data", ->
      assert.equal(content.body.constructor, String)
      assert.equal(content.body, JSON.stringify(content.data))

    context.test "has a length property equal to body's length", ->
      assert.equal(content.length, content.body.length)

