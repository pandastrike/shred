// One of the reasons we're defining the implementation here using private
// methods is so that clients can use call or apply with one mixin without
// introducing a dependency on another (ex: Getters without Setters)

var _ = require("underscore")
;

var corsetCase = function(string) {
  return string.toLowerCase().replace(/(^|-)(\w)/g, function(s) { 
      return s.toUpperCase(); });
};

var initializeHeaders = function(object) {
  return {};
};

var $H = function(object) {
  return object._headers||(object._headers=initializeHeaders(object));
};

var getHeader = function(object,name) {
  return $H(object)[corsetCase(name)];
};

var getHeaders = function(object,names) {
  var keys = (names && names.length>0) ? names : Object.keys($H(object));
  var hash = keys.reduce(function(hash,key) {
    hash[key] = getHeader(object,key);
    return hash;
  },{});
  Object.freeze(hash);
  return hash;
};

var setHeader = function(object,name,value) {
  $H(object)[corsetCase(name)] = value;
  return object;
};

var setHeaders = function(object,hash) {
  for( var key in hash ) { setHeader(object,key,hash[key]); };
  return this;
};

var Headers = {
  Getters: {
    Methods: {
      getHeader: function(name) { return getHeader(this,name); },
      getHeaders: function() { return getHeaders(this,_(arguments)); }
    },
    Properties: {},
    mixWith: function(exemplar) { return mixin(exemplar,this); }
  },
  Setters: {
    Methods: {
      setHeader: function(key,value) { return setHeader(this,key,value); },
      setHeaders: function(hash) { return setHeaders(this,hash); }
    },
    Properties: {},
    mixWith: function(exemplar) { return mixin(exemplar,this); }
  },
};

var mixin = function(exemplar,mixin) {
  for (var method in mixin.Methods) {
    exemplar.prototype[method] = mixin.Methods[method];
  }
  Object.defineProperties(exemplar.prototype, mixin.Properties);
  return exemplar;
};


module.exports = Headers;