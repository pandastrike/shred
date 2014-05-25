commands = require "./commands"
console.log commands
usage = ->
  console.error "Oh no!"
  process.exit(-1)

[_, _, command, subcommand, args...] = process.argv
subcommand ?= "list"
options = {}

processors =
  droplets:
    list: ->
    add: ->
      while args.length > 0
        switch args.shift()
          when "--name", "-n" then options.name = args.shift()
          when "--size", "-s" then options.size_slug = args.shift()
          when "--image", "-i" then options.image_slug = args.shift()
          when "--region", "-r" then options.region_slug = args.shift()
          when "--key", "-k" then options.ssh_key_ids = args.shift()
          else usage()
    destroy: ->
      while args.length > 0
        switch args.shift()
          when "--id", "-i" then options.oid = args.shift()
          else usage()

  sizes:
    list: ->
  regions:
    list: ->
  images:
    list: ->

  keys:
    add: ->
      while args.length > 0
        switch args.shift()
          when "--name", "-n" then options.name = args.shift()
          when "--key", "-k" then options.ssh_pub_key = args.shift()
          else usage()


if processors[command]?[subcommand]?
  processors[command][subcommand]()
  commands[command][subcommand] options
else
  usage()
