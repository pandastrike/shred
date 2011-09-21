var _ = require("underscore")
;

require.paths.push(__dirname);
var Modules = {
  Request: require("surf/request"),
  Response: require("surf/response")
}

var Surf = function(options) {
  this.options = options||{};
};

_.extend(Surf,Modules);

var Methods = {
  request: function(options) {
    return new Surf.Request(this, _.defaults(options,this.options));
  }
};

"GET PUT POST DELETE".split(" ").forEach(function(method) {
  Methods[method] = Methods[method.toLowerCase(method)] = function(options) {
    options.method = method;
    return this.request(options);
  };
});

_.extend(Surf.prototype,Methods);

module.exports = Surf;