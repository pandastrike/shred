# Shred is an HTTP client library intended to simplify the use of Node's
# built-in HTTP library. In particular, we wanted to make it easier to interact
# with HTTP-based APIs.
# 
# See the [examples](./examples.html) for more details.

# Ax is a nice logging library we wrote. You can use any logger, providing it
# has `info`, `warn`, `debug`, and `error` methods that take a string.
Ax = require("ax")
CookieJarLib = require("cookiejar")
CookieJar = CookieJarLib.CookieJar

# Shred takes some options, including a logger and request defaults.
Shred = (options) ->
  options = (options or {})
  @agent = options.agent
  @defaults = options.defaults or {}
  @log = options.logger or (new Ax(level: "info"))
  @_sharedCookieJar = new CookieJar()
  @logCurl = options.logCurl or false


# Most of the real work is done in the request and reponse classes.
Shred.Request = require("./shred/request")
Shred.Response = require("./shred/response")
Shred.registerProcessor = require("./shred/content").registerProcessor

# The `request` method kicks off a new request, instantiating a new `Request`
# object and passing along whatever default options we were given.
Shred:: = request: (options) ->
  options.logger = options.logger or @log
  options.logCurl = options.logCurl or @logCurl
  
  # allow users to set cookieJar = null
  options.cookieJar = (if ("cookieJar" of options) then options.cookieJar else @_sharedCookieJar)
  options.agent = options.agent or @agent
  
  # fill in default options
  for key of @defaults
    options[key] = @defaults[key]  if @defaults.hasOwnProperty(key) and not options[key]
  new Shred.Request(options)


# Define a bunch of convenience methods so that you don't have to include
# a `method` property in your request options.
"get put post delete".split(" ").forEach (method) ->
  Shred::[method] = (options) ->
    options.method = method
    @request options

module.exports = Shred
