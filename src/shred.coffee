{include, type, base64} = require "fairmont"
{EventChannel} = require "mutual"
url = require "url"
parse_url = url.parse
resolve = url.resolve
querystring = require "querystring"
schemes =
  http: require "http"
  https: require "https"
returning = (value, block) -> block value ;  value

Authorization =
  basic: ({username, password}) ->
    "Basic " + base64("#{username}:#{password}")

class Method
  constructor: ({@resource, @method, @headers, @expect}) ->
    # load version from file instead of hard-coding
    @headers["user-agent"] ?= "shred v0.9.0"
    @expect = [ @expect ] unless type(@expect) is "array"

  request: (body=null) ->
    @resource.events.source (events) =>
      events.pipe = (pipe) -> @_pipe = pipe
      if body?
        unless type(body) is "string"
          body = JSON.stringify(body)
      events.safely =>
        handler = (response) =>
          events.safely =>
            if response.statusCode in @expect
              expected response
            else if response.statusCode in [ 301, 302, 303, 305, 307 ]
              request(response.headers.location)
            else
              unexpected response

        expected = (response) =>
          events.emit "success", response
          read response

        unexpected = (response) =>
          {statusCode} = response
          events.emit "error",
            new Error "Expected #{@expect}, got #{statusCode}"
          read response

        read = (response) =>
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
          if events._pipe?
            stream.pipe events._pipe
          else
            if response.statusCode in @expect
              response.on "ready", (data) ->
                events.emit "ready", data
            stream.on "data", (chunk) -> data += chunk
            stream.on "end", ->
              # TODO: this is not a safe way to check for a JSON
              # content-type. We should also make the parser
              # extensible.
              if response.headers["content-type"]?.match(/json/)
                data = JSON.parse(data)
              # TODO: Consider using a separate event channel for this?
              response.emit "ready", data

        request = (url) =>
          # TODO: Check for a null or invalid URL
          {protocol, hostname, port, path} = parse_url url
          scheme = protocol[0..-2] # remove trailing :
          schemes[scheme]
          .request
            hostname: hostname
            port: port || (if scheme is 'https' then 443 else 80)
            path: path
            method: @method.toUpperCase()
            headers: @headers
          .on "response", handler
          .on "error", (error) =>
            events.emit "error", error
          .end(body)

        request @resource.url

class Resource

  @reserved: ["url", "events", "path", "query",
    "expand", "describe"]

  @actions: (resource) ->
    returning {}, (_actions) ->
      for key, value of resource when (value.method instanceof Method)
        _actions[key] = value.method

  @action: (resource, name, description) ->
    description.resource = resource
    method = new Method(description)
    resource[name] = (args...) -> method.request(args...)
    resource[name].method = method
    resource[name].authorize = (credentials) ->
      returning method, ->
        [scheme] = Object.keys(credentials)
        transform = Authorization[scheme]
        method.headers["authorization"] = transform(credentials[scheme])

  constructor: ({@url, @events}) ->

  path: (path) ->
    returning (new Resource @), (resource) =>
      resource.url = resolve(@url, path)
      resource.describe(Resource.actions(@))

  query: (query) ->
    query = querystring.stringify(query)
    returning (new Resource @), (resource) =>
      resource.url = "#{@url}?#{query}"
      resource.describe(Resource.actions(@))

  expand: (parameters) ->
    template = (require "url-template").parse @url
    returning (new Resource @), (resource) =>
      resource.url = template.expand parameters
      resource.describe(Resource.actions(@))

  describe: (actions) ->
    returning @, (resource) ->
      for name, description of actions when name not in Resource.reserved
        Resource.action(resource, name, description)

resource = (url, events = new EventChannel) -> new Resource({url, events})

module.exports = {resource}
