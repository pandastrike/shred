{overload} = require "typely"
{include} = require "fairmont"
{Evie} = require "evie"
http = require "http"
url = require "url"
parse_url = url.parse

method = ({name, url, events}) ->
  fn = (body=null) ->
    fn.events.source (events) ->
      handler = (response) ->
        switch response.statusCode
          when fn.expect
            success response
          when 301, 302, 303, 305, 307
            request(response.headers.location)
          else
            unexpected(response)
      success = (response) ->
        events.emit "success", response
        body = ""
        response.on "data", (data) -> body += data
        response.on "end", -> events.emit "ready", body
      unexpected = (response) ->
        {statusCode} = response
        events.emit "error",
          "Expected #{fn.expect}, got #{statusCode}"
      request = (url) ->
        {hostname, port, path} = parse_url url
        http.request
          hostname: hostname
          port: port || 80
          path: path
          method: fn.method.toUpperCase()
          headers: fn.headers
        .on "response", handler
        .on "error", (error) ->
          events.emit "error", error
        .end()
      request fn.url
  fn.method = name
  fn.url = url
  fn.events = events
  fn.describe = ({headers, expect}) ->
    fn.headers = headers
    fn.expect = expect
  fn

resource = (url=null) ->
  fn = overload (match) ->
    match "string", "object", (path, query) ->
    match "string", (path) ->
    match "object", (query) ->
  fn.events = events = new Evie
  fn.url = url
  for name in ["get", "put", "delete", "post"]
    fn[name] = method {name, url, events}
  fn

module.exports = {resource}
