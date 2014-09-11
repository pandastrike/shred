querystring = require "querystring"
resolve_url = (require "url").resolve

{include, clone, type, base64} = require "fairmont"
{overload} = require "typely"
Evie = require "evie"

{request} = require "./request"

Authorization =
  basic: ({username, password}) ->
    "Basic " + base64("#{username}:#{password}")


clone_actions = (description) ->
  _description = {}
  for method, definition of description when type(definition) != "function"
    _description[method] = definition
  _description



resource = overload (match) ->

  match "string", (url) -> resource {url}

  match "string", "object", (url, description) -> resource {url, description}

  match "object", ({url, events, description}) ->

    from_path = (path, _description) ->
      _description ?= clone_actions description
      resource
        url: resolve_url(url, path)
        events: events.source()
        description: _description

    from_parameters = do ->
      template = (require "url-template").parse url
      (parameters, _description=description) ->
        resource
          url: template.expand(parameters)
          events: events.source()
          description: _description

    make_request = (definition) ->
      definition.events ?= events
      definition.url ?= url
      definition.headers ?= {}
      fn = -> request(definition, arguments...)
      fn.invoke = -> fn.apply(null, arguments)
      include fn,
        authorize: (credentials) ->
          [scheme] = Object.keys(credentials)
          transform = Authorization[scheme]
          authorization = transform(credentials[scheme])
          _definition = clone definition
          _definition.headers.authorization = authorization
          make_request(_definition)
      fn

    events ?= new Evie

    _resource = overload (match) ->

      match "string", (path) -> from_path path
      match "string", "object", (path, description) ->
        from_path path, description

      match "object", (parameters) ->
        from_parameters parameters

      match "object", "object", (parameters, description) ->
        from_parameters parameters, description

    _resource.on = (args...) -> events.on(args...); _resource

    for method, definition of description
      _resource[method] = switch type(definition)
        when "object"
          make_request(clone definition)
        when "function"
          definition _resource

    _resource

module.exports = {resource}
