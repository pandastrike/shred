util = require 'util'
{spawn, exec} = require 'child_process'
run = (command) ->
  child = exec(command.line)
  child.stdout.on "data", command.handler||(data) -> util.print(data)
  child.stderr.on "data", (data) -> process.stderr.write(data)
  child


task 'test', 'run all the specs', ->
  commands = {
    server: {
      line: "node_modules/rephraser/bin/rephraser test/rephraser.conf",
      handler: (data) ->
        util.print data
        # we're assuming here that output to stdout
        # means a successful start and so we set up
        # our exit handler to shut down rephraser
        unless commands.specs.child
          commands.specs.child = run commands.specs
          commands.specs.child.on "exit", ->
            commands.server.child.kill()
    },
    specs: {
      line: "node_modules/vows/bin/vows --spec test/*.js",
    }
  }
  exec "mkdir log ; mkdir log/specs",(error,stdin,stdout) ->
    commands.server.child = run commands.server

task 'docs', 'generate the inline documentation', ->
  exec "rm -rf docs/*.html", (error) -> 
  exec "node_modules/docco/bin/docco lib/*.js lib/shred/*.js lib/shred/mixins/*.js examples/*.js", (error) ->
    if error
      console.log error.message
    else
      exec "cp docs/shred.html docs/index.html", (error) ->
        console.log error.message if error
