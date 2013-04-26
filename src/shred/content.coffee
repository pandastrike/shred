
# The purpose of the `Content` object is to abstract away the data conversions
# to and from raw content entities as strings. For example, you want to be able
# to pass in a Javascript object and have it be automatically converted into a
# JSON string if the `content-type` is set to a JSON-based media type.
# Conversely, you want to be able to transparently get back a Javascript object
# in the response if the `content-type` is a JSON-based media-type.

# One limitation of the current implementation is that it [assumes the `charset` is UTF-8](https://github.com/spire-io/shred/issues/5).

# The `Content` constructor takes an options object, which *must* have either a
# `body` or `data` property and *may* have a `type` property indicating the
# media type. If there is no `type` attribute, a default will be inferred.
Content = (options) ->
  @body = options.body
  @data = options.data
  @type = options.type

Content:: = {}

# Treat `toString()` as asking for the `content.body`. That is, the raw content entity.
#
#     toString: function() { return this.body; }
#
# Commented out, but I've forgotten why. :/

# `Content` objects have the following attributes:
Object.defineProperties Content::,
  
  # - **type**. Typically accessed as `content.type`, reflects the `content-type`
  #   header associated with the request or response. If not passed as an options
  #   to the constructor or set explicitly, it will infer the type the `data`
  #   attribute, if possible, and, failing that, will default to `text/plain`.
  type:
    get: ->
      if @_type
        return @_type
      else
        if @_data
          switch typeof @_data
            when "string"
              return "text/plain"
            when "object"
              return "application/json"
      "text/plain"

    set: (value) ->
      @_type = value
      this

    enumerable: true

  
  # - **data**. Typically accessed as `content.data`, reflects the content entity
  #   converted into Javascript data. This can be a string, if the `type` is, say,
  #   `text/plain`, but can also be a Javascript object. The conversion applied is
  #   based on the `processor` attribute. The `data` attribute can also be set
  #   directly, in which case the conversion will be done the other way, to infer
  #   the `body` attribute.
  data:
    get: ->
      if @_body
        @processor.parser @_body
      else
        @_data

    set: (data) ->
      Errors.setDataWithBody this  if @_body and data
      @_data = data
      this

    enumerable: true

  
  # - **body**. Typically accessed as `content.body`, reflects the content entity
  #   as a UTF-8 string. It is the mirror of the `data` attribute. If you set the
  #   `data` attribute, the `body` attribute will be inferred and vice-versa. If
  #   you attempt to set both, an exception is raised.
  body:
    get: ->
      if @_data
        @processor.stringify @_data
      else
        @_body.toString()

    set: (body) ->
      Errors.setBodyWithData this  if @_data and body
      @_body = body
      this

    enumerable: true

  
  # - **processor**. The functions that will be used to convert to/from `data` and
  #   `body` attributes. You can add processors. The two that are built-in are for
  #   `text/plain`, which is basically an identity transformation and
  #   `application/json` and other JSON-based media types (including custom media
  #   types with `+json`). You can add your own processors. See below.
  processor:
    get: ->
      processor = Content.processors[@type]
      if processor
        processor
      else
        
        # Return the first processor that matches any part of the
        # content type. ex: application/vnd.foobar.baz+json will match json.
        main = @type.split(";")[0]
        parts = main.split(/\+|\//)
        i = 0
        l = parts.length

        while i < l
          processor = Content.processors[parts[i]]
          i++

        processor || { parser: identity, stringify: => toString}

    enumerable: true

  
  # - **length**. Typically accessed as `content.length`, returns the length in
  #   bytes of the raw content entity.
  length:
    get: ->
      return Buffer.byteLength(@body)  if typeof Buffer isnt "undefined"
      @body.length

Content.processors = {}

# The `registerProcessor` function allows you to add your own processors to
# convert content entities. Each processor consists of a Javascript object with
# two properties:
# - **parser**. The function used to parse a raw content entity and convert it
#   into a Javascript data type.
# - **stringify**. The function used to convert a Javascript data type into a
#   raw content entity.
Content.registerProcessor = (types, processor) ->
  
  # You can pass an array of types that will trigger this processor, or just one.
  # We determine the array via duck-typing here.
  if types.forEach
    types.forEach (type) ->
      Content.processors[type] = processor

  else
    
    # If you didn't pass an array, we just use what you pass in.
    Content.processors[types] = processor


# Register the identity processor, which is used for text-based media types.
identity = (x) ->
  x

toString = (x) ->
  x.toString()

Content.registerProcessor ["text/html", "text/plain", "text"],
  parser: identity
  stringify: toString


# Register the JSON processor, which is used for JSON-based media types.
Content.registerProcessor ["application/json; charset=utf-8", "application/json", "json"],
  parser: (string) ->
    JSON.parse string

  stringify: (data) ->
    JSON.stringify data

qs = require("querystring")

# Register the post processor, which is used for JSON-based media types.
Content.registerProcessor ["application/x-www-form-urlencoded"],
  parser: qs.parse
  stringify: qs.stringify


# Error functions are defined separately here in an attempt to make the code
# easier to read.
Errors =
  setDataWithBody: (object) ->
    throw new Error("Attempt to set data attribute of a content object " + "when the body attributes was already set.")

  setBodyWithData: (object) ->
    throw new Error("Attempt to set body attribute of a content object " + "when the data attributes was already set.")

module.exports = Content
