{resolve} = require "path"
{resource} =
{EventChannel} = require "mutual"
events = new EventChannel
resources = require "./resources"

ready = (handler) ->
  (response) ->
    if response.status is "ERROR"
      events.emit "error", response
    else
      handler(response)

api = do ->
  {resource} = require "../../src/shred"
  resource
    url: "https://api.digitalocean.com/v1{/noun}{/oid}{/verb}/?" +
      "client_id={id}&api_key={key}{&query*}"
    events: events
    description: {invoke: {method: "get", expect: 200}}

build = ({singular, plural}) ->
  list: ({id, key}) ->
    events.source (events) ->
      api(noun: plural, id: id, key: key)
      .invoke()
      .on "ready", ready (response) ->
        events.emit "success", response[plural]
        
  add: ({id, key, description}) ->
    events.source (events) ->
      api(noun: plural, verb: "new", id: id, key: key, query: description)
      .invoke()
      .on "ready", ready (response) ->
        events.emit "success", response[singular]

  destroy: ({id, key, oid, description}) ->
    events.source (events) ->
      api
        noun: plural
        verb: "destroy"
        id: id
        key: key
        oid: oid,
        query: description
      .invoke()
      .on "ready", ready (response) ->
        events.emit "success", response


module.exports = do (client={}) ->
  client.on = -> events.on arguments...
  for name, resource of resources
    client[name] = build resource
  client
