/*!
 * Surf
 * ~~~~~~
 * Streaming Server
 */

var defaults = {
  'port': 8887
};

module.exports = function config ( options ) {

  options || (options = {})

  var settings = defaults
    , keys = Object.keys(options)

  for (var key in keys)
    settings[key] = options[key]

  return settings;

}