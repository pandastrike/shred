{resolve} = require "path"
parse_url = (require "url").parse

{promise} = require "when"

schemes =
  http: require "http"
  https: require "https"

{read, type, is_array, is_string} = require "fairmont"

user_agent = "Shred v1.0.0-alpha"
redirects = [ 301, 302, 303, 305, 307 ]

request = ({url, method, headers, redirect, expect}, body) ->

  url ?= window?.url
  method ?= "GET"
  headers ?= {}
  redirect ?= true
  headers["user-agent"] ?= user_agent
  expect ?= [ 200 ]
  expect = if is_array expect then expect else [ expect ]



  # TODO: handle streams
  body =
    if body?
      if is_string body || is_stream body
        body
      else to_json body

  promise (resolve, reject) ->

    # the main response handler
    handler = (response) ->
      data = readBody response
      if response.statusCode in expect
        resolve {response, data}
      else if response.statusCode in redirects && redirect is true
        _request response.headers.location
      else
        {statusCode} = response
        _error = new Error "Expected #{expect}, got #{statusCode}"
        _error.context = {response, data}
        reject _error

    # actually read the body of the respone, decoding if necessary
    readBody = (response) ->
      if stream?
        transform = switch response.headers["content-encoding"]
          when 'gzip'
            zlib = require "zlib"
            response.pipe zlib.createGunzip()
          when 'deflate'
            zlib = require "zlib"
            response.pipe zlib.createInflate()
          else
            response
        transform.pipe stream

      else
        promise (resolve, reject) ->
          body = ""
          response.on "data", (data) -> body += data
          response.on "end", ->
            # TODO: this is not a safe way to check for a JSON
            # content-type. We should also make the parser
            # extensible.
            if response.headers["content-type"]?.match(/json/)
              try
                resolve JSON.parse body
              catch error
                reject error
            else
              resolve body

    do _request = (url) ->
      # TODO: Check for a null or invalid URL
      {protocol, hostname, port, path} = parse_url url
      scheme = protocol[0..-2] # remove trailing :
      schemes[scheme]
      .request
        hostname: hostname
        port: port || window?.port || (if scheme is 'https' then 443 else 80)
        path: path
        method: method.toUpperCase()
        headers: headers
      .on "response", handler
      .on "error", (error) -> reject error
      .end(body)

module.exports = {request}
