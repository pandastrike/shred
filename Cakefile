sys = require 'sys'
{spawn, exec} = require 'child_process'
run = (command) ->
  console.log(command.line)
  child = exec(command.line)
  child.stdout.on "data", command.handler||(data) -> sys.print data
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
        unless commands.specs.child
          commands.specs.child = run commands.specs
          commands.specs.child.on "exit", ->
            commands.server.child.kill()
    },
    specs: {
      line: "node_modules/vows/bin/vows --spec spec/surf.js",
    }
  }

  commands.server.child = run commands.server