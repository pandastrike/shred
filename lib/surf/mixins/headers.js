// TODO: Add header specific intelligence 
// (ex: not setting Content-Length if body is set)

var corsetCase = function(string) {
  return string.toLowerCase().replace(/(^|-)(\w)/g, function(s) { 
      return s.toUpperCase(); });
};

var getHeaders = function(object) {
  return object._headers||(object._headers={});
};

var Headers = {
  Getters: {

    getHeader: function(name) {
      return getHeaders(this)[corsetCase(name)];
    },

    getHeaders: function(names) {
      var keys = names ? names : Object.keys(getHeaders(this));
      return keys.reduce(function(hash,key) {
        hash[key] = this.getHeader(key);
        return hash;
      },{});
    }
  },
  
  Setters: {
    setHeader: function(key,value) {
      getHeaders(this)[corsetCase(key)] = value;
      return this;
    },
    setHeaders: function(hash) {
      for( var key in hash ) { this.setHeader(key, hash[key]); };
      return this;
    }
  }
};

module.exports = Headers;