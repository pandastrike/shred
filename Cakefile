util = require 'util'
{spawn, exec} = require 'child_process'
run = (command) ->
  child = exec(command.line)
  child.stdout.on "data", command.handler||(data) -> util.print(data)
  child.stderr.on "data", (data) -> process.stderr.write(data)
  child

task 'bundle', 'create the bundled version of shred for browsers', ->
  TaskHelpers.makeBundle()

task 'bundle:min', 'create the bundled and minified version of shred.js for browsers', ->
  TaskHelpers.makeBundle ->
    fs = require 'fs'
    uglify = require 'uglify-js'

    fs.readFile 'browser/shred.bundle.js', 'utf8', (err, data)->
      throw err if err

      minified = uglify data

      fs.writeFile 'browser/shred.bundle.min.js', minified, (err)->
        throw err if err

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

task 'test:server', 'launch a server for the browser tests', (o)->
  path = require 'path'
  fs = require 'fs'
  {exec} = require 'child_process'
  express = require 'express'
  app = express.createServer()
  libSrc = path.join __dirname, 'browser/shred.bundle.js'
  http = require 'http'
  _ = require 'underscore'

  app.get '/shred.bundle.js', (req, res)->
    TaskHelpers.makeBundle ->
      res.header 'Content-Type', 'text/javascript'
      res.sendfile libSrc

  app.get '/', (req, res)->
    index = [
      '<html>'
      '<head>'
      '  <title>spire.io.js | specs</title>'
      '  <link rel="shortcut icon"'
      '    type="image/png" href="jasmine/favicon.png" />'
      '  <script src="shred.bundle.js"></script>'
      '</head>'
      ''
      '<body>'
      '</body>'
      '</html>'
    ].join '\n'
    res.header 'Content-Type', 'text/html'
    res.send(index);

  app.listen 8080, 'localhost', ->
    process.stdout.write 'Test server running:\n'
    process.stdout.write '  => http://' + o.host + ':' + o.port
    process.stdout.write '\n'


TaskHelpers =
  makeBundle: (callback) ->
    fs = require 'fs'
    browserify = require 'browserify'

    bundle = browserify(
      require: [
        "./lib/shred.js",
        {'http': 'http-browserify'},
        {'https': 'http-browserify'}
      ]
      ignore: ['zlib']
    ).bundle()

    fs.writeFile 'browser/shred.bundle.js', bundle, (err)->
      throw err if err
      callback() if callback

