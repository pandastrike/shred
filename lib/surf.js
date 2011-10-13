var _ = require("underscore")
  , Ax = require("ax")
;

require.paths.push(__dirname);
var Modules = {
  Request: require("./surf/request"),
  Response: require("./surf/response")
}

var Surf = function(options) {
  options = (options||{});
  this.defaults = options.defaults||{};
  this.log = options.logger||(new Ax({ level: "info" }));
};

_.extend(Surf,Modules);

var Methods = {
  request: function(options) {
    return new Surf.Request(this, _.defaults(options,this.defaults));
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