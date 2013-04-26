# The header mixins allow you to add HTTP header support to any object. This
# might seem pointless: why not simply use a hash? The main reason is that, per
# the [HTTP spec](http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2),
# headers are case-insensitive. So, for example, `content-type` is the same as
# `CONTENT-TYPE` which is the same as `Content-Type`. Since there is no way to
# overload the index operator in Javascript, using a hash to represent the
# headers means it's possible to have two conflicting values for a single
# header.
# 
# The solution to this is to provide explicit methods to set or get headers.
# This also has the benefit of allowing us to introduce additional variations,
# including snake case, which we automatically convert to what Matthew King has
# dubbed "corset case" - the hyphen-separated names with initial caps:
# `Content-Type`. We use corset-case just in case we're dealing with servers
# that haven't properly implemented the spec.

# Convert headers to corset-case. **Example:** `CONTENT-TYPE` will be converted
# to `Content-Type`.
corsetCase = (string) ->
  string.toLowerCase().replace("_", "-").replace /(^|-)(\w)/g, (s) ->
    s.toUpperCase()



# We suspect that `initializeHeaders` was once more complicated ...
initializeHeaders = (object) ->
  {}


# Access the `_headers` property using lazy initialization. **Warning:** If you
# mix this into an object that is using the `_headers` property already, you're
# going to have trouble.
$H = (object) ->
  object._headers or (object._headers = initializeHeaders(object))


# Hide the implementations as private functions, separate from how we expose them.

# The "real" `getHeader` function: get the header after normalizing the name.
getHeader = (object, name) ->
  $H(object)[corsetCase(name)]


# The "real" `getHeader` function: get one or more headers, or all of them
# if you don't ask for any specifics. 
getHeaders = (object, names) ->
  keys = (if (names and names.length > 0) then names else Object.keys($H(object)))
  hash = {}
  i = 0
  l = keys.length

  while i < l
    key = keys[i]
    hash[key] = getHeader(object, key)
    i++
  Object.freeze hash
  hash


# The "real" `setHeader` function: set a header, after normalizing the name.
setHeader = (object, name, value) ->
  $H(object)[corsetCase(name)] = value
  object


# The "real" `setHeaders` function: set multiple headers based on a hash.
setHeaders = (object, hash) ->
  for key of hash
    setHeader object, key, hash[key]
  this


# Here's where we actually bind the functionality to an object. These mixins work by
# exposing mixin functions. Each function mixes in a specific batch of features.
module.exports =
  
  # Add getters.
  getters: (constructor) ->
    constructor::getHeader = (name) ->
      getHeader this, name

    constructor::getHeaders = (args...) ->
      getHeaders this, args

  
  # Add setters but as "private" methods.
  privateSetters: (constructor) ->
    constructor::_setHeader = (key, value) ->
      setHeader this, key, value

    constructor::_setHeaders = (hash) ->
      setHeaders this, hash

  
  # Add setters.
  setters: (constructor) ->
    constructor::setHeader = (key, value) ->
      setHeader this, key, value

    constructor::setHeaders = (hash) ->
      setHeaders this, hash

  
  # Add both getters and setters.
  gettersAndSetters: (constructor) ->
    constructor::getHeader = (name) ->
      getHeader this, name

    constructor::getHeaders = (args...) ->
      getHeaders this, args

    constructor::setHeader = (key, value) ->
      setHeader this, key, value

    constructor::setHeaders = (hash) ->
      setHeaders this, hash
