# Introduction

Our basic approach here is to provide a single function that creates self-similar functions. Think of these as a _resource functions_.

## Preamble

We first just pick up a bunch of library code that we're going to need.

    querystring = require "querystring"
    resolve_url = (require "url").resolve

    {include, clone, type, base64} = require "fairmont"

Typely allows us to overload methods.

    {overload} = require "typely"

Our request library encapsulates Node's HTTP client library for us.

    {request} = require "./request"

We have a dictionary of authorization functions. We only support basic auth at the moment.

    Authorization =
      basic: ({username, password}) ->
        "Basic " + base64("#{username}:#{password}")

Okay, now we're ready to get down to business.

## The `resource` Function

We can call `resource` in one of three ways:

* With a string (a URL)

* With a string and an object (a description of the resource)

* With an object describing the resource

We basically implement the first two of these in terms of the third.

    resource = overload (match) ->

      match "string", (url) -> resource {url}

      match "string", "object", (url, description) -> resource {url, description}

In other words, we don't really get to the good stuff until now. The object can include properties for the URL, the description, and an event emitter.

      match "object", ({url, events, description}) ->

We define some more helper functions, which we do here because we need access to the closure to implement them.

### Constructing a Resource Function From a Path

We need to be able to simply append a path to the resource we're defining. That's what `from_path` does.

        from_path = (path, _description=description) ->
          resource
            url: resolve_url(url, path)
            events: events.source()
            description: _description

The `events.source()` is the event-bubbling. We're creating a new event channel, but allowing it to bubble up to the current resource.

### Constructing a Resource Function From Parameters

Another way to create a resource is by adding parameters for a URL template. That's what we're doing here. We don't need to re-parse the current template, so we do that outside the subsidiary resource function.

        from_parameters = do ->
          template = (require "url-template").parse url
          (parameters, _description=description) ->
            resource
              url: template.expand(parameters)
              events: events.source()
              description: _description

### Adding Operations to a Resource

Of course, we need to do more than simply define nested resources. The `make_request` function will take an action definition and decorate it so that we can reliable make an HTTP(S) request. We return a function that will actually make the request. The function itself is decorated with an `authorize` method and an `invoke` method (which we need if we call `authorize`).

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

### Creating the New Resource

We now can handle all the scenarios we need: creating subsidiary resources (via URLs, relative paths, or templates). We're ready to define the resource function that we'll return whenever we call `resource`.

We create an event channel if we don't already have one.

        events ?= new Evie

The resource function is overloaded similarly to the top-level variant. The key differences are that we can now define a resource using query parameters.

If we get a string as the first argument, we know it's a path (or a URL, but _resolve_url_ will take care of that for us). If we get an object, we know we're trying to expand a URL template.

In either event, an optional second parameter describes the resource (basically, adding actions).

        _resource = overload (match) ->

          match "string", (path) -> from_path path
          match "string", "object", (path, description) ->
            from_path path, description

          match "object", (parameters) ->
            from_parameters parameters

          match "object", "object", (parameters, description) ->
            from_parameters parameters, description

We need a way to add event handlers to the resource. This is a little bit unfortunate, because it means you can't have a resource named `on`.

        _resource.on = (args...) -> events.on(args...); _resource

We add actions or subsidiary resources based on the description. An object describes an action, so we call `make_request` for those. A function means we'er defining a subsidiary resource, so we call it, with the current resource as an argument for context.

When we're defining a subsidiary resource, we want to make sure there's a description of the resource so we don't try to use the current resource. Otherwise, we'd end up with an infinite recursion. So, in that case, we tack on an empty object to the argument list.

        for name, definition of description
          do (name, definition) ->
            _resource[name] = switch type(definition)
              when "object"
                make_request(clone definition)
              when "function"
                definition ->
                  if arguments.length == 1
                    _resource arguments..., {}
                  else
                    _resource arguments...

That's it. We're done. Just return the newly created resource function.

        _resource

## Exporting the Resource Function

We need only export the one top-level resource function. Why not just make the `exports` the one function then? Because we're reserving the right to export more stuff in future versions.

    module.exports = {resource}
