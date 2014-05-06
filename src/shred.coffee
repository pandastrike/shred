{include} = require "fairmont"
{EventChannel} = require "mutual"
url = require "url"
parse_url = url.parse
resolve = url.resolve
querystring = require "querystring"
schemes =
  http: require "http"
  https: require "https"

# TODO:
# - Add a way to control the agent
# - Verify that we can support auth correctly
# - Add support for piping the results to/from streams
# - Auto-marshal the body if it's an object and the
#   content-type is JSON-based
# - Add pre-build step to generate JavaScript
# - Add gzip and caching support
# - Add cookie support (for spoofing Web sites)

class Method
  constructor: (@_resource, {method, headers, expect}) ->
    @_events = @_resource._events.source()
    @_method = method
    @_headers = headers
    # load version from file instead of hard-coding
    @_headers["user-agent"] ?= "shred v0.9.0"
    @_expect = expect
  _request: (body=null) ->
    @_events.source (events) =>
      events.safely =>
        handler = (response) =>
          events.safely =>
            switch response.statusCode
              when @_expect
                expected response
              when 301, 302, 303, 305, 307
                request(response.headers.location)
              else
                unexpected response

        expected = (response) =>
          events.emit "success", response
          data = ""
          response.on "data", (chunk) -> data += chunk
          response.on "end", ->
            # TODO: this is not a safe way to check for a JSON
            # content-type. We should also make the parser
            # extensible.
            if response.headers["content-type"]?.match(/json/)
              data = JSON.parse(data)
            # TODO: Consider using a separate event channel for this?
            events.emit "ready", data

        unexpected = (response) =>
          {statusCode} = response
          # TODO: This should be a real error
          events.emit "error",
            "Expected #{@_expect}, got #{statusCode}"

        request = (url) =>
          # TODO: Check for a null or invalid URL
          console.log url
          {protocol, hostname, port, path} = parse_url url
          scheme = protocol[0..-2] # remove trailing :
          schemes[scheme]
          .request
            hostname: hostname
            port: port || (if scheme is 'https' then 443 else 80)
            path: path
            method: @_method.toUpperCase()
            headers: @_headers
          .on "response", handler
          .on "error", (error) =>
            events.emit "error", error
          .end()

        request @_resource._url

class Resource

  constructor: (args...) ->
    switch args.length
      when 1
        [@_url] = args
        @_events = new EventChannel
      when 2
        [resource, path] = args
        @_url = resolve(resource._url, path)
        @_events = resource._events.source()

method = (args...) ->
  method = new Method(args...)
  (args...) -> method._request(args...)

resource = (args...)-> new Resource(args...)

events = (object) -> object._events

module.exports = {resource, method, events}
