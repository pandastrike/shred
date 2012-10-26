Shred = require "../lib/shred"
Testify = require "testify"
assert = require "assert"

shred = new Shred()

request_error_handler = (error) ->
  throw new Error("Request error. Is Rephraser running?")

http_error_handler = (context) ->
  (response) ->
    context.fail "Unexpected HTTP error: #{response.status}"

Testify.test "Shred", (context) ->

  context.test "A minimal valid GET", (context) ->
    shred.get
      url: "http://localhost:31337/200"
      on:
        request_error: request_error_handler
        error: http_error_handler(context)
        response: (response) ->
          context.test "response status is 200", ->
            assert.equal response.status, 200
          context.test "response does not have a content-type header", ->
            assert.ok(!response.content.data.headers["Content-Type"])
          context.test "response.content.body is a String", ->
            assert.equal(response.content.body.constructor, String)
          context.test "response.content._body is a Buffer", ->
            assert.ok(Buffer.isBuffer(response.content._body))

  context.test "A minimal valid POST request", (context) ->
    shred.post
      url: "http://localhost:31337/200"
      on:
        request_error: request_error_handler
        error: http_error_handler(context)
        response: (response) ->
          context.test "response status is 200", ->
            assert.equal response.status, 200
          context.test "response does not have a content-type header", ->
            assert.ok(!response.content.data.headers["Content-Type"])


  context.test "A minimal valid POST request with a body", (context) ->
    shred.post
      url: "http://localhost:31337/200"
      content: "Hello"
      on:
        request_error: request_error_handler
        error: http_error_handler(context)
        response: (response) ->
          context.test "response status is 200", ->
            assert.equal response.status, 200
          context.test "response has default content-type header", ->
            assert.equal(
              response.content.data.headers["Content-Type"],
              "text/plain"
            )


  context.test "A POST with content type of 'application/json'", (context) ->

    context.test "Setting the body using an object as the content property", (context) ->
      object = content: {foo: 1, bar: 2}
      shred.post
        url: "http://localhost:31337/201"
        content: object
        headers:
          "Content-Type": "application/json"
        on:
          request_error: request_error_handler
          error: http_error_handler(context)
          response: (response) ->
            context.test "response status is 201", ->
              assert.equal response.status, 201
            context.test "response body is as expected", ->
              assert.deepEqual response.content.data.body, object
            context.test "response has content-type header: 'application/json'", ->
              assert.equal(
                response.content.data.headers["Content-Type"],
                "application/json"
              )

    context.test "Setting the body directly with a string as the body property", (context) ->
      object = content: {foo: 1, bar: 2}
      string = JSON.stringify(object)
      shred.post
        url: "http://localhost:31337/201"
        body: string
        headers:
          "Content-Type": "application/json"
        on:
          request_error: request_error_handler
          error: http_error_handler(context)
          response: (response) ->
            context.test "response body is as expected", ->
              assert.deepEqual response.content.data.body, object
            context.test "response has content-type header: 'application/json'", ->
              assert.equal(
                response.content.data.headers["Content-Type"],
                "application/json"
              )

  context.test "A GET that receives a redirect (301)", (context) ->
    shred.get
      url: "http://localhost:31337/301"
      on:
        request_error: request_error_handler
        error: http_error_handler(context)
        response: (response) ->
          context.test "transparently handles the redirect", ->
            assert.equal response.status, 200

  context.test "A GET that receives a redirect (302)", (context) ->
    shred.get
      url: "http://localhost:31337/302"
      on:
        request_error: request_error_handler
        error: http_error_handler(context)
        response: (response) ->
          context.test "transparently handles the redirect", ->
            assert.equal response.status, 200


  context.test "Requests with specific and generic status handlers", (context) ->


    context.test "On success, only exact status handler fires", (context) ->
      shred.get
        url: "http://localhost:31337/200"
        on:
          request_error: request_error_handler
          error: http_error_handler(context)
          200: (response) ->
            context.pass()
          response: (response) ->
            context.fail "generic response handler fired"


    context.test "On error, only the exact error status handler fires", (context) ->
      shred.get
        url: "http://localhost:31337/404"
        on:
          request_error: (error) ->
            context.fail "request_error handler fired"
          404: (response) ->
            context.pass()
          error: (response) ->
            context.fail "generic error handler fired"
          response: (response) ->
            context.fail "generic response handler fired"


    context.test "On non-HTTP failure, only the request_error handler fires", (context) ->
      shred.get
        url: "http://localhost:65535/"
        on:
          request_error: (error) ->
            context.test "The callback argument is an Error", ->
              assert.equal error.constructor, Error
          error: (response) ->
            context.fail "generic error handler fired"
          response: (response) ->
            context.fail "generic response handler fired"


  context.test "Request with timeout set using an Integer", (context) ->

    context.test "Only the timeout handler fires", (context) ->
      shred.get
        url: "http://localhost:31337/timeout"
        timeout: 100
        on:
          request_error: (error) ->
            context.fail "request_error handler fired"
          error: (response) ->
            context.fail "generic error handler fired"
          response: (response) ->
            context.fail "generic response handler fired"
          timeout: ->
            context.pass()


  context.test "Request with a timeout set using an object", (context) ->
    context.test "Only the timeout handler fires", (context) ->
      shred.get
        url: "http://localhost:31337/timeout"
        timeout: { seconds: 1 }
        on:
          request_error: (error) ->
            context.fail "request_error handler fired"
          error: (response) ->
            context.fail "generic error handler fired"
          response: (response) ->
            context.fail "generic response handler fired"
          timeout: ->
            context.pass()


  context.test "Request with Accept-Encoding 'gzip'", (context) ->
    shred.get
      url: "http://www.example.com/"
      headers:
        "Accept-Encoding": "gzip"
      on:
        request_error: request_error_handler
        error: http_error_handler(context)
        200: (response) ->
          context.test "has proper gzip data", ->
            # TODO: this test doesn't appear to be really helpful
            assert.ok (response.content._body.toString().length > 0)

# pending
##Testify.test "A request from Shred with its own agent"
##Testify.test "A request using an passed in agent"
##Testify.test "A request with a 'socket' event listener"

