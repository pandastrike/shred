// TODO: Add header specific intelligence 
// (ex: not setting Content-Length if body is set)

var corsetCase = function(string) {
  return string.toLowerCase().replace(/(^|-)(\w)/g, function(s) { 
      return s.toUpperCase(); });
};

var initializeHeaders = function(object) {
  var headers = {};
  if (object.setHeader) {
    Object.defineProperties(headers,{
      "Content-Length": {
        get: function() { object.body ? object.body.length : 0 ; }
      }
    });
  }
  return headers;
};

var getHeaders = function(object) {
  return object._headers||(object._headers=initializeHeaders(object));
};

var getHeader = function(object,name) {
  return getHeaders(object)[corsetCase(name)];
};

var setHeader = function(object,name,value) {
  getHeaders(object)[corsetCase(name)] = value;
  return object;
};

var Headers = {
  Getters: {

    getHeader: function(name) {
      return getHeader(this,name);
    },

    getHeaders: function(names) {
      var object = this;
      var keys = names ? names : Object.keys(getHeaders(this));
      var hash = keys.reduce(function(hash,key) {
        hash[key] = getHeader(object,key);
        return hash;
      },{});
      Object.freeze(hash);
      return hash;
    }
  },
  
  Setters: {
    setHeader: function(key,value) {
      return setHeader(this,key,value);
    },
    setHeaders: function(hash) {
      for( var key in hash ) { setHeader(this,key,hash[key]); };
      return this;
    }
  }
};


module.exports = Headers;