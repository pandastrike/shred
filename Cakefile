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
      line: "node_modules/rephraser/bin/rephraser spec/rephraser.conf",
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

task 'bundle', 'Generate the browser bundle for chat.js', (options)->
  fs = require 'fs'
  path = require 'path'
  browserify = require 'browserify'
  module = path.join __dirname, 'lib', 'surf.js'
  bundle = path.join __dirname, 'spec', 'browser', 'surf.js'

  src = browserify({ filter : require('uglify-js') })
    .require(module)
    .bundle()
  ;

  buffer = new Buffer [
    # 'var Surf = (function () {'
    src
    # '; return require("./surf")'
    # '})()'
  ].join '';

  fs.writeFile bundle, buffer, (err) ->
    throw err if err;

    console.log bundle + ' written (' + buffer.length + ' bytes)'