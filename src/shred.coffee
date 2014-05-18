querystring = require "querystring"
resolve_url = (require "url").resolve

{include, clone, type, base64} = require "fairmont"
{overload} = require "typely"
{EventChannel} = require "mutual"

{request} = require "./request"

returning = (value, block) -> block value ;  value

Authorization =
  basic: ({username, password}) ->
    "Basic " + base64("#{username}:#{password}")

resource = overload (match) ->

  match "string", (url) -> resource {url}

  match "string", "object", (url, description) -> resource {url, description}

  match "object", ({url, events, description}) ->

    events ?= new EventChannel
    listen = ->

    returning
      _url: url,
      on: (args...)->
        returning @, -> events.on(args...)
      (object) ->

        return unless description?

        make_request = (definition) ->
          definition.events ?= events
          definition.url ?= url
          returning (-> request(definition, arguments...)), (fn) ->
            include fn,
              authorize: (credentials) ->
                [scheme] = Object.keys(credentials)
                transform = Authorization[scheme]
                authorization = transform(credentials[scheme])
                _definition = clone definition
                _definition.headers.authorization = authorization
                make_request(_definition)

        for method, definition of description

          object[method] =

            switch type(definition)

              when "object" then make_request(clone definition)

              when "function"

                definition

                  path: (path, description) ->
                    resource
                      url: resolve_url(url, path)
                      events: events.source()
                      description: description

                  query: (description) ->
                    params = querystring.stringify(params)
                    (parameters) ->
                      resource
                        url: "#{url}?#{params}"
                        events: events.source()
                        description: description

                  expand: (description)->
                    template = (require "url-template").parse url
                    (parameters) ->
                      resource
                        url: template.expand(parameters)
                        events: events.source()
                        description: description


module.exports = {resource}
