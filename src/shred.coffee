# Shred is an HTTP client library intended to simplify the use of Node's
# built-in HTTP library. In particular, we wanted to make it easier to interact
# with HTTP-based APIs.
# 
# See the [examples](./examples.html) for more details.

# Ax is a nice logging library we wrote. You can use any logger, providing it
# has `info`, `warn`, `debug`, and `error` methods that take a string.
Ax = require("ax")
{CookieJar} = require("cookiejar")

Request = require("./shred/request")

# Shred takes some options, including a logger and request defaults.

module.exports = class Shred
  constructor: (options={}) ->
    @agent = options.agent
    @defaults = options.defaults || {}
    @log = options.logger || (new Ax(level: "info"))
    unless options.cookies == false
      @_sharedCookieJar = new CookieJar()
    @logCurl = options.logCurl || false

  # The `request` method kicks off a new request, instantiating a new `Request`
  # object and passing along whatever default options we were given.
  request: (options) ->
    options.logger ||= @log
    options.logCurl ||= @logCurl
    
    # allow users to set cookieJar = null
    options.cookieJar = (if ("cookieJar" of options) then options.cookieJar else @_sharedCookieJar)
    options.agent ||= @agent
    
    # fill in default options
    for own key, value of @defaults
      options[key] ||= value

    new Request(options)

# Define a bunch of convenience methods so that you don't have to include
# a `method` property in your request options.
"get put post delete".split(" ").forEach (method) ->
  Shred::[method] = (options) ->
    options.method = method
    @request options

# Most of the real work is done in the request and reponse classes.
Shred.registerProcessor = require("./shred/content").registerProcessor

