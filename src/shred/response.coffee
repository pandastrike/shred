# The `Response object` encapsulates a Node.js HTTP response.
Content = require("./content")
HeaderMixins = require("./mixins/headers")
CookieJarLib = require("cookiejar")
Cookie = CookieJarLib.Cookie

# Browser doesn't have zlib.
zlib = null
try
  zlib = require("zlib")
catch e
  console.warn "no zlib library"

# Iconv doesn't work in browser
Iconv = null
try
  Iconv = require("iconv-lite")
catch e
  console.warn "no iconv library"

# Construct a `Response` object. You should never have to do this directly. The
# `Request` object handles this, getting the raw response object and passing it
# in here, along with the request. The callback allows us to stream the response
# and then use the callback to let the request know when it's ready.
Response = (raw, request, callback) ->
  response = this
  @_raw = raw
  
  # The `._setHeaders` method is "private"; you can't otherwise set headers on
  # the response.
  @_setHeaders.call this, raw.headers
  
  # store any cookies
  if request.cookieJar and @getHeader("set-cookie")
    cookieStrings = @getHeader("set-cookie")
    cookieObjs = []
    cookie = undefined
    i = 0

    while i < cookieStrings.length
      cookieString = cookieStrings[i]
      continue  unless cookieString
      cookieString += "; domain=" + request.host  unless cookieString.match(/domain\=/i)
      cookieString += "; path=" + request.path  unless cookieString.match(/path\=/i)
      try
        cookie = new Cookie(cookieString)
        cookieObjs.push cookie  if cookie
      catch e
        console.warn "Tried to set bad cookie: " + cookieString
      i++
    request.cookieJar.setCookies cookieObjs
  @request = request
  @client = request.client
  @log = @request.log
  
  # Stream the response content entity and fire the callback when we're done.
  # Store the incoming data in a array of Buffers which we concatinate into one
  # buffer at the end.  We need to use buffers instead of strings here in order
  # to preserve binary data.
  chunks = []
  dataLength = 0
  raw.on "data", (chunk) ->
    chunks.push chunk
    dataLength += chunk.length

  raw.on "end", ->
    body = chunks.join("")
    setBodyAndFinish = (body) ->
      response._body = new Content(
        body: body
        type: response.getHeader("Content-Type")
      )
      callback response

    if zlib and response.getHeader("Content-Encoding") is "gzip"
      zlib.gunzip body, (err, gunzippedBody) ->
        if Iconv and response.request.encoding
          body = Iconv.fromEncoding(gunzippedBody, response.request.encoding)
        else
          body = gunzippedBody.toString()
        setBodyAndFinish body

    else
      body = Iconv.fromEncoding(body, response.request.encoding)  if response.request.encoding
      setBodyAndFinish body



# The `Response` object can be pretty overwhelming to view using the built-in
# Node.js inspect method. We want to make it a bit more manageable. This
# probably goes [too far in the other
# direction](https://github.com/spire-io/shred/issues/2).
Response:: =
  inspect: ->
    response = this
    headers = @format_headers()
    summary = ["<Shred Response> ", response.status].join(" ")
    [summary, "- Headers:", headers].join "\n"

  format_headers: ->
    array = []
    headers = @headers
    for key of headers
      if headers.hasOwnProperty(key)
        value = headers[key]
        array.push "\t" + key + ": " + value
    array.join "\n"


# `Response` object properties, all of which are read-only:
Object.defineProperties Response::,
  
  # - **status**. The HTTP status code for the response. 
  status:
    get: ->
      @_raw.statusCode

    enumerable: true

  
  # - **content**. The HTTP content entity, if any. Provided as a [content
  #   object](./content.html), which will attempt to convert the entity based upon
  #   the `content-type` header. The converted value is available as
  #   `content.data`. The original raw content entity is available as
  #   `content.body`.
  body:
    get: ->
      @_body

  content:
    get: ->
      @body

    enumerable: true

  headers:
    get: ->
      @_headers

    enumerable: true

  
  # - **isRedirect**. Is the response a redirect? These are responses with 3xx
  #   status and a `Location` header.
  isRedirect:
    get: ->
      @status > 299 and @status < 400 and @getHeader("Location")

    enumerable: true

  
  # - **isError**. Is the response an error? These are responses with status of
  #   400 or greater.
  isError:
    get: ->
      @status is 0 or @status > 399

    enumerable: true


# Add in the [getters for accessing the normalized headers](./headers.js).
HeaderMixins.getters Response
HeaderMixins.privateSetters Response

# Work around Mozilla bug #608735 [https://bugzil.la/608735], which causes
# getAllResponseHeaders() to return {} if the response is a CORS request.
# xhr.getHeader still works correctly.
getHeader = Response::getHeader
Response::getHeader = (name) ->
  getHeader.call(this, name) or (typeof @_raw.getHeader is "function" and @_raw.getHeader(name))

module.exports = Response
