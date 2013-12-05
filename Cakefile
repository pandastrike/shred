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

task 'docs', 'generate the inline documentation', ->
  exec "rm -rf docs/*.html", (error) -> 
  exec "node_modules/docco/bin/docco lib/*.js lib/shred/*.js lib/shred/mixins/*.js examples/*.js", (error) ->
    if error
      console.log error.message
    else
      exec "cp docs/shred.html docs/index.html", (error) ->
        console.log error.message if error

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

