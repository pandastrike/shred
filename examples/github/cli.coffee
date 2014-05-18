commands = require "./commands"

usage = ->
  console.error "Oh no!"
  process.exit(-1)

[_,_,args...] = process.argv
options = {}
list = ->
  while args.length > 0
    switch args.shift()
      when "--owner", "-o" then options.owner = args.shift()
      when "--repo", "-r" then options.repo = args.shift()
      else usage()
  commands.list options

create = ->
  while args.length > 0
    switch args.shift()
      when "--owner", "-o" then options.owner = args.shift()
      when "--repo", "-r" then options.repo = args.shift()
      when "--title", "-t" then options.title = args.shift()
      when "--body", "-b" then options.body = args.shift()
      else usage()
  commands.create options

while args.length > 0
  switch args.shift()
    when "list", "ls" then list()
    when "create", "add" then create()
    else usage()
