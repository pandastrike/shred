{overload} = require "typely"
{include} = require "fairmont"
{EventChannel} = require "mutual"
url = require "url"
parse_url = url.parse
resolve = url.resolve
querystring = require "querystring"

method = ({name, url, events}) ->
  fn = (body=null) ->
    fn.events.source (events) ->
      handler = (response) ->
        switch response.statusCode
          when fn.expect
            expected response
          when 301, 302, 303, 305, 307
            request(response.headers.location)
          else
            unexpected response
      expected = (response) ->
        events.emit "success", response
        body = ""
        response.on "data", (data) -> body += data
        response.on "end", ->
          content_type = response.headers["content-type"]
          if content_type? and content_type.match(/json/)
            body = JSON.parse(body)
          events.emit "ready", body
      unexpected = (response) ->
        {statusCode} = response
        events.emit "error",
          "Expected #{fn.expect}, got #{statusCode}"
      request = (url) ->
        try
          {protocol, hostname, port, path} = parse_url url
          scheme = protocol[0..-2] # remote trailing :
          (require scheme).request
            hostname: hostname
            port: port || (if scheme is 'https' then 443 else 80)
            path: path
            method: fn.method.toUpperCase()
            headers: fn.headers
          .on "response", handler
          .on "error", (error) ->
            events.emit "error", error
          .end()
        catch error
          events.emit "error", error
      request fn.url
  fn.method = name
  fn.url = url
  fn.events = events
  fn.describe = ({headers, expect}) ->
    fn.headers = headers
    fn.headers["user-agent"] ?= "shred v0.9.0"
    fn.expect = expect
  fn

resource = (url=null, events = new EventChannel) ->
  fn = overload (match) ->
    match "string", "object", (path, query) ->
      resource(resolve(url, path) +
        querystring.stringify(query), events.source())
    match "string", (path) ->
      resource(resolve(url, path), events.source())
    match "object", (query) ->
      resource(querystring.stringify(query), events.source())
  fn.events = events
  fn.url = url
  for name in ["get", "put", "delete", "post"]
    fn[name] = method {name, url, events}
  fn

module.exports = {resource}
