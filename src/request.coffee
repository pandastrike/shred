{resolve} = require "path"
parse_url = (require "url").parse


schemes =
  http: require "http"
  https: require "https"

{read, type} = require "fairmont"

user_agent = do ->
  version = do ->
    try
      path = resolve __dirname, "..", "package.json"
      JSON.parse(read(path)).version
    catch
      console.warn "Can't find version"
      ""
  "shred #{version}"

redirects = [ 301, 302, 303, 305, 307 ]

request = ({events, url, method, headers, redirect, pipe, expect}, body) ->
  redirect ?= true
  headers["user-agent"] ?= user_agent
  expect = [ expect ] unless type(expect) is "array"

  events.source (_events) ->
    _events.pipe = (_pipe) -> pipe = _pipe
    if body?
      unless type(body) is "string"
        body = JSON.stringify(body)

    _events.safely ->

      # the main response handler
      handler = (response) ->
        _events.safely ->
          if response.statusCode in expect
            expected response
          else if response.statusCode in redirects && redirect is true
            request(response.headers.location)
          else
            unexpected response

      # for an expected response, emit success and begin processing body
      expected = (response) ->
        _events.emit "success", response
        read response

      # an unexpected response is an error
      unexpected = (response) ->
        {statusCode} = response
        _events.emit "error",
          new Error "Expected #{@expect}, got #{statusCode}"
        read response

      # actually read the body of the respone, decoding if necessary
      read = (response) ->
        stream = switch response.headers["content-encoding"]
          when 'gzip'
            zlib = require "zlib"
            response.pipe zlib.createGunzip()
          when 'deflate'
            zlib = require "zlib"
            response.pipe zlib.createInflate()
          else
            response

        data = ""
        if pipe?
          stream.pipe pipe
        else
          # we have to again check the status code because we process the
          # response body even for unexpected responses
          if response.statusCode in expect
            response.on "ready", (data) ->
              _events.emit "ready", data
          stream.on "data", (chunk) -> data += chunk
          stream.on "end", ->
            # TODO: this is not a safe way to check for a JSON
            # content-type. We should also make the parser
            # extensible.
            if response.headers["content-type"]?.match(/json/)
              data = JSON.parse(data)
            # TODO: Consider using a separate event channel for this?
            response.emit "ready", data

      # a nice function actually, you know, make the request
      _request = (url) ->
        # TODO: Check for a null or invalid URL
        {protocol, hostname, port, path} = parse_url url
        scheme = protocol[0..-2] # remove trailing :
        schemes[scheme]
        .request
          hostname: hostname
          port: port || (if scheme is 'https' then 443 else 80)
          path: path
          method: method.toUpperCase()
          headers: headers
        .on "response", handler
        .on "error", (error) =>
          _events.emit "error", error
        .end(body)

      _request url

module.exports = {request}
