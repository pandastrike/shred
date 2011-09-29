sys = require 'sys'
{spawn, exec} = require 'child_process'
run = (command) ->
  child = exec(command.line)
  child.stdout.on "data", command.handler||(data) -> sys.print(data)
  child.stderr.on "data", (data) -> process.stderr.write(data)
  child


task 'docs', 'generate the inline documentation', ->
  command = {
    line: [
      'rm -r docs'
      'node_modules/docco/bin/docco lib/*.js lib/surf/*.js'
    ].join(' && '),
  }
  run command

task 'test', 'run all the specs', ->
  commands = {
    server: {
      line: "rephraser spec/rephraser.conf",
      handler: (data) -> 
        sys.print data
        # we're assuming here that output to stdout
        # means a successful start and so we set up
        # our exit handler to shut down rephraser
        unless commands.specs.child
          commands.specs.child = run commands.specs
          commands.specs.child.on "exit", ->
            commands.server.child.kill()
    },
    specs: {
      line: "node_modules/vows/bin/vows --spec spec/*.js",
    }
  }
  exec "mkdir log ; mkdir log/specs",(error,stdin,stdout) -> 
    commands.server.child = run commands.server