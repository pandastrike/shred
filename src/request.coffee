{resolve} = require "path"
parse_url = (require "url").parse

{promise} = require "when"

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

counter = 0
request = ({url, method, headers, redirect, stream, expect}, body) ->
  id = ++counter
  redirect ?= true
  headers["user-agent"] ?= user_agent
  expect = [ expect ] unless type(expect) is "array"

  if body?
    unless type(body) is "string"
      body = JSON.stringify(body)

  promise (resolve, reject) ->

    # the main response handler
    handler = (response) ->
      readBody response
      if response.statusCode in expect
        resolve response
      else if response.statusCode in redirects && redirect is true
        request(response.headers.location)
      else
        {statusCode} = response
        _error = new Error "Expected #{expect}, got #{statusCode}"
        _error.response = response
        reject _error

    # actually read the body of the respone, decoding if necessary
    readBody = (response) ->
      transform = switch response.headers["content-encoding"]
        when 'gzip'
          zlib = require "zlib"
          response.pipe zlib.createGunzip()
        when 'deflate'
          zlib = require "zlib"
          response.pipe zlib.createInflate()
        else
          response

      data = ""
      if stream?
        transform.pipe stream
      else
        response.on "data", (chunk) -> data += chunk
        response.on "end", ->
          # TODO: this is not a safe way to check for a JSON
          # content-type. We should also make the parser
          # extensible.
          if response.headers["content-type"]?.match(/json/)
            data = JSON.parse(data)
          # TODO: We probably shouldn't do this
          response.emit "ready", data

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
    .on "error", (error) -> reject error
    .end(body)

module.exports = {request}
