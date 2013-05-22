# The request object encapsulates a request, creating a Node.js HTTP request and
# then handling the response.
HTTP = require("http")
HTTPS = require("https")
parseUri = require("./parseUri")
Emitter = require("events").EventEmitter
sprintf = require("sprintf").sprintf
Response = require("./response")
HeaderMixins = require("./mixins/headers")
Content = require("./content")
STATUS_CODES = HTTP.STATUS_CODES or
  100: "Continue"
  101: "Switching Protocols"
  102: "Processing" # RFC 2518, obsoleted by RFC 4918
  200: "OK"
  201: "Created"
  202: "Accepted"
  203: "Non-Authoritative Information"
  204: "No Content"
  205: "Reset Content"
  206: "Partial Content"
  207: "Multi-Status" # RFC 4918
  300: "Multiple Choices"
  301: "Moved Permanently"
  302: "Moved Temporarily"
  303: "See Other"
  304: "Not Modified"
  305: "Use Proxy"
  307: "Temporary Redirect"
  400: "Bad Request"
  401: "Unauthorized"
  402: "Payment Required"
  403: "Forbidden"
  404: "Not Found"
  405: "Method Not Allowed"
  406: "Not Acceptable"
  407: "Proxy Authentication Required"
  408: "Request Time-out"
  409: "Conflict"
  410: "Gone"
  411: "Length Required"
  412: "Precondition Failed"
  413: "Request Entity Too Large"
  414: "Request-URI Too Large"
  415: "Unsupported Media Type"
  416: "Requested Range Not Satisfiable"
  417: "Expectation Failed"
  418: "I'm a teapot" # RFC 2324
  422: "Unprocessable Entity" # RFC 4918
  423: "Locked" # RFC 4918
  424: "Failed Dependency" # RFC 4918
  425: "Unordered Collection" # RFC 4918
  426: "Upgrade Required" # RFC 2817
  500: "Internal Server Error"
  501: "Not Implemented"
  502: "Bad Gateway"
  503: "Service Unavailable"
  504: "Gateway Time-out"
  505: "HTTP Version not supported"
  506: "Variant Also Negotiates" # RFC 2295
  507: "Insufficient Storage" # RFC 4918
  509: "Bandwidth Limit Exceeded"
  510: "Not Extended" # RFC 2774


# The Shred object itself constructs the `Request` object. You should rarely
# need to do this directly.
Request = (options) ->
  @log = options.logger
  @cookieJar = options.cookieJar
  @encoding = options.encoding
  @logCurl = options.logCurl
  processOptions this, options or {}
  createRequest this


# A `Request` has a number of properties, many of which help with details like
# URL parsing or defaulting the port for the request.
Object.defineProperties Request::,
  
  # - **url**. You can set the `url` property with a valid URL string and all the
  #   URL-related properties (host, port, etc.) will be automatically set on the
  #   request object.
  url:
    get: ->
      return null  unless @scheme
      sprintf "%s://%s:%s%s", @scheme, @host, @port, ((if @proxy then "/" else @path)) + ((if @query then ("?" + @query) else ""))

    set: (_url) ->
      _url = parseUri(_url)
      @scheme = _url.protocol
      @host = _url.host
      @port = _url.port
      @path = _url.path
      @query = _url.query
      this

    enumerable: true

  
  # - **headers**. Returns a hash representing the request headers. You can't set
  #   this directly, only get it. You can add or modify headers by using the
  #   `setHeader` or `setHeaders` method. This ensures that the headers are
  #   normalized - that is, you don't accidentally send `Content-Type` and
  #   `content-type` headers. Keep in mind that if you modify the returned hash,
  #   it will *not* modify the request headers.
  headers:
    get: ->
      @getHeaders()

    enumerable: true

  
  # - **port**. Unless you set the `port` explicitly or include it in the URL, it
  #   will default based on the scheme.
  port:
    get: ->
      unless @_port
        switch @scheme
          when "https"
            return @_port = 443
          when "http"
          else
            return @_port = 80
      @_port

    set: (value) ->
      @_port = value
      this

    enumerable: true

  
  # - **method**. The request method - `get`, `put`, `post`, etc. that will be
  #   used to make the request. Defaults to `get`.
  method:
    get: ->
      @_method = (@_method or "GET")

    set: (value) ->
      @_method = value
      this

    enumerable: true

  
  # - **query**. Can be set either with a query string or a hash (object). Get
  #   will always return a properly escaped query string or null if there is no
  #   query component for the request.
  query:
    get: ->
      @_query

    set: (value) ->
      stringify = (hash) ->
        query = ""
        for key of hash
          query += encodeURIComponent(key) + "=" + encodeURIComponent(hash[key]) + "&"
        
        # Remove the last '&'
        query = query.slice(0, -1)
        query

      if value
        value = stringify(value)  if typeof value is "object"
        @_query = value
      else
        @_query = ""
      this

    enumerable: true

  
  # - **parameters**. This will return the query parameters in the form of a hash
  #   (object).
  parameters:
    get: ->
      QueryString.parse @_query or ""

    enumerable: true

  
  # - **content**. (Aliased as `body`.) Set this to add a content entity to the
  #   request. Attempts to use the `content-type` header to determine what to do
  #   with the content value. Get this to get back a [`Content`
  #   object](./content.html).
  body:
    get: ->
      @_body

    set: (value) ->
      @_body = new Content(
        data: value
        encoding: @getHeader("Content-Encoding")
        type: @getHeader("Content-Type")
      )
      @setHeader "Content-Type", @content.type
      @setHeader "Content-Length", @content.length
      this

    enumerable: true

  
  # - **timeout**. Used to determine how long to wait for a response. Does not
  #   distinguish between connect timeouts versus request timeouts. Set either in
  #   milliseconds or with an object with temporal attributes (hours, minutes,
  #   seconds) and convert it into milliseconds. Get will always return
  #   milliseconds.
  timeout:
    get: -> # in milliseconds
      @_timeout

    set: (timeout) ->
      request = this
      milliseconds = 0
      return this  unless timeout
      if typeof timeout is "number"
        milliseconds = timeout
      else
        milliseconds = (timeout.milliseconds or 0) + (1000 * ((timeout.seconds or 0) + (60 * ((timeout.minutes or 0) + (60 * (timeout.hours or 0))))))
      @_timeout = milliseconds
      this

    enumerable: true

  sslStrict:
    get: -> @_sslStrict
    set: (value) ->
      if typeof value != "boolean"
        return @
      @_sslStrict = value
      return @
    enumerable: true



# Alias `body` property to `content`. Since the [content object](./content.html)
# has a `body` attribute, it's preferable to use `content` since you can then
# access the raw content data using `content.body`.
Object.defineProperty Request::, "content", Object.getOwnPropertyDescriptor(Request::, "body")

# The `Request` object can be pretty overwhelming to view using the built-in
# Node.js inspect method. We want to make it a bit more manageable. This
# probably goes [too far in the other
# direction](https://github.com/spire-io/shred/issues/2).
Request::inspect = ->
  request = this
  headers = @format_headers()
  summary = ["<Shred Request> ", request.method.toUpperCase(), request.url].join(" ")
  [summary, "- Headers:", headers].join "\n"

Request::format_headers = ->
  array = []
  headers = @_headers
  for key of headers
    if headers.hasOwnProperty(key)
      value = headers[key]
      array.push "\t" + key + ": " + value
  array.join "\n"


# Allow chainable 'on's:  shred.get({ ... }).on( ... ).  You can pass in a
# single function, a pair (event, function), or a hash:
# { event: function, event: function }
Request::on = (eventOrHash, listener) ->
  emitter = @emitter
  
  # Pass in a single argument as a function then make it the default response handler
  if arguments_.length is 1 and typeof (eventOrHash) is "function"
    emitter.on "response", eventOrHash
  else if arguments_.length is 1 and typeof (eventOrHash) is "object"
    for key of eventOrHash
      emitter.on key, eventOrHash[key]  if eventOrHash.hasOwnProperty(key)
  else
    emitter.on eventOrHash, listener
  this


# Add in the header methods. Again, these ensure we don't get the same header
# multiple times with different case conventions.
HeaderMixins.gettersAndSetters Request

# `processOptions` is called from the constructor to handle all the work
# associated with making sure we do our best to ensure we have a valid request.
processOptions = (request, options) ->
  request.log.debug "Processing request options .."
  
  # We'll use `request.emitter` to manage the `on` event handlers.
  request.emitter = (new Emitter)
  request.agent = options.agent
  
  # Set up the handlers ...
  if options.on
    for key of options.on
      request.emitter.on key, options.on[key]  if options.on.hasOwnProperty(key)
  
  # Make sure we were give a URL or a host
  if not options.url and not options.host
    request.emitter.emit "request_error", new Error("No url or url options (host, port, etc.)")
    return
  
  # Allow for the [use of a proxy](http://www.jmarshall.com/easy/http/#proxies).
  if options.url
    if options.proxy
      request.url = options.proxy
      request.path = options.url
    else
      request.url = options.url
  
  # Set the remaining options.
  request.query = options.query or options.parameters or request.query
  request.method = options.method
  
  # FIXME: options.agent is supposed to be a Node http.Agent, not the
  # User-Agent string.
  request.setHeader "user-agent", options.agent or "Shred"
  request.setHeaders options.headers
  if request.cookieJar
    cookies = request.cookieJar.getCookies(CookieAccessInfo(request.host, request.path))
    if cookies.length
      cookieString = request.getHeader("cookie") or ""
      cookieIndex = 0

      while cookieIndex < cookies.length
        cookieString += ";"  if cookieString.length and cookieString[cookieString.length - 1] isnt ";"
        cookieString += cookies[cookieIndex].name + "=" + cookies[cookieIndex].value + ";"
        ++cookieIndex
      request.setHeader "cookie", cookieString
  
  # The content entity can be set either using the `body` or `content` attributes.
  request.content = options.body or options.content  if options.body or options.content
  request.timeout = options.timeout

  if typeof(options.sslStrict) == "undefined"
    request.sslStrict = true
  else
    request.sslStrict = options.sslStrict


# `createRequest` is also called by the constructor, after `processOptions`.
# This actually makes the request and processes the response, so `createRequest`
# is a bit of a misnomer.
createRequest = (request) ->
  timeoutId = undefined
  request.log.debug "Creating request .."
  request.log.debug request
  reqParams =
    host: request.host
    port: request.port
    method: request.method
    path: request.path + ((if request.query then "?" + request.query else ""))
    headers: request.getHeaders()
    rejectUnauthorize: request._sslStrict
    
    # Node's HTTP/S modules will ignore this, but we are using the
    # browserify-http module in the browser for both HTTP and HTTPS, and this
    # is how you differentiate the two.
    scheme: request.scheme
    
    # Use a provided agent.  'Undefined' is the default, which uses a global
    # agent.
    agent: request.agent

  logCurl request  if request.logCurl
  http = (if request.scheme is "http" then HTTP else HTTPS)
  
  # Set up the real request using the selected library. The request won't be
  # sent until we call `.end()`.
  request._raw = http.request(reqParams, (response) ->
    
    # The "cleanup" event signifies that any timeout or error handlers
    # that have been set for this request should now be disposed of.
    request.emitter.emit "cleanup"
    request.log.debug "Received response .."
    
    # We haven't timed out and we have a response, so make sure we clear the
    # timeout so it doesn't fire while we're processing the response.
    clearTimeout timeoutId
    
    # Construct a Shred `Response` object from the response. This will stream
    # the response, thus the need for the callback. We can access the response
    # entity safely once we're in the callback.
    response = new Response(response, request, (response) ->
      
      # Set up some event magic. The precedence is given first to
      # status-specific handlers, then to responses for a given event, and then
      # finally to the more general `response` handler. In the last case, we
      # need to first make sure we're not dealing with a a redirect.
      emit = (event) ->
        emitter = request.emitter
        textStatus = (if STATUS_CODES[response.status] then STATUS_CODES[response.status].toLowerCase() else null)
        if emitter.listeners(response.status).length > 0 or emitter.listeners(textStatus).length > 0
          emitter.emit response.status, response
          emitter.emit textStatus, response
        else
          if emitter.listeners(event).length > 0
            emitter.emit event, response
          else emitter.emit "response", response  unless response.isRedirect

      
      #console.warn("Request has no event listener for status code " + response.status);
      
      # Next, check for a redirect. We simply repeat the request with the URL
      # given in the `Location` header. We fire a `redirect` event.
      if response.isRedirect
        request.log.debug "Redirecting to " + response.getHeader("Location")
        request.url = response.getHeader("Location")
        emit "redirect"
        createRequest request
      
      # Okay, it's not a redirect. Is it an error of some kind?
      else if response.isError
        emit "error"
      else
        
        # It looks like we're good shape. Trigger the `success` event.
        emit "success"
    )
  )
  request._raw.setMaxListeners 30 # avoid warnings
  
  # We're still setting up the request. Next, we're going to handle error cases
  # where we have no response. We don't emit an error event because that event
  # takes a response. We don't response handlers to have to check for a null
  # value. However, we [should introduce a different event
  # type](https://github.com/spire-io/shred/issues/3) for this type of error.
  request._raw.on "error", (error) ->
    request.emitter.emit "request_error", error  unless timeoutId
    request.emitter.emit "cleanup", error

  request._raw.on "socket", (socket) ->
    request.emitter.emit "socket", socket

  
  # TCP timeouts should also trigger the "response_error" event.
  request._raw.on "socket", ->
    timeout_handler = ->
      request._raw.abort()

    request.emitter.once "cleanup", ->
      request._raw.socket.removeListener "timeout", timeout_handler

    
    # This should trigger the "error" event on the raw request, which will
    # trigger the "response_error" on the shred request.
    request._raw.socket.on "timeout", timeout_handler

  
  # We're almost there. Next, we need to write the request entity to the
  # underlying request object.
  if request.content
    request.log.debug "Streaming body: '" + request.content.body.slice(0, 59) + "' ... "
    request._raw.write request.content.body
  
  # Finally, we need to set up the timeout. We do this last so that we don't
  # start the clock ticking until the last possible moment.
  if request.timeout
    timeoutId = setTimeout(->
      request.log.debug "Timeout fired, aborting request ..."
      request.emitter.emit "timeout", request
      request._raw.abort()
    , request.timeout)
  
  # The `.end()` method will cause the request to fire. Technically, it might
  # have already sent the headers and body.
  request.log.debug "Sending request ..."
  request._raw.end()


# Logs the curl command for the request.
logCurl = (req) ->
  headers = req.getHeaders()
  headerString = ""
  for key of headers
    headerString += "-H \"" + key + ": " + headers[key] + "\" "
  bodyString = ""
  bodyString += "-d '" + req.content.body + "' "  if req.content
  query = (if req.query then "?" + req.query else "")
  console.log "curl " + "-X " + req.method.toUpperCase() + " " + req.scheme + "://" + req.host + ":" + req.port + req.path + query + " " + headerString + bodyString

module.exports = Request
