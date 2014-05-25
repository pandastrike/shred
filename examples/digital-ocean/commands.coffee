{resolve} = require "path"
{read} = require "fairmont"
{parse} = require "c50n"
resources = require "./resources"
api = require "./api"


{id, key} = parse(read(resolve(__dirname, ".token")).trim())

api.on "error", (error) -> console.log error

build = (name, {singular, plural}) ->
  list: ->
    api[name].list {id, key}
    .on "success", (items) ->
      for {id, name, slug} in items
        if slug?
          console.log id, name, slug
        else
          console.log id, name

  add: (description) ->
    api[name].add {id, key, description}
    .on "success", (item) ->
      console.log "#{item.name} added."

  destroy: (description) ->
    oid = description.oid
    delete description.oid
    api[name].destroy {id, key, oid, description}
    .on "success", ->
      console.log "#{singular} destroyed."

module.exports = do (commands={})->
  for name, resource of resources
    commands[name] = build name, resource
  commands
