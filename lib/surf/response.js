var _ = require("underscore")
  , Content = require("surf/content")
  , HeaderMixins = require("surf/mixins/headers")
  
;

var Response = function(raw, request, callback) { 
  var response = this;
  this._raw = raw; 
  this.setHeaders(raw.headers);
  this.request = request;
  this.client = request.client;
  this.log = this.request.log;
  var body = "";
  raw.on("data", function(data) { body += data; });
  raw.on("end", function() {
    response.body = body;
    callback(response);
  });
};

Response.prototype = {
  inspect: function() {
    var response = this;
    var headers = _(response.headers).reduce(function(array,value,key){
      array.push("\t" + key + ": " + value); return array;
    },[]).join("\n");
    var summary = ["<Surf Response> ", response.status].join(" ")
    return [ summary, "- Headers:", headers].join("\n");
  }
};

Object.defineProperties(Response.prototype, {
  status: {
    get: function() { return this._raw.statusCode; },
    enumerable: true
  },
  contentType: {
    get: function() { return this.getHeader("Content-Type"); },
    enumerable: true
  },
  body: {
    get: function() { return this._body; },
    set: function(value) {
      this._body = new Content(value, this.contentType);
    },
    enumerable: true
  },
  isRedirect: {
    get: function() {
      return (this.status>299
          &&this.status<400
          &&this.headers.location);
    },
    enumerable: true
  },
  isError: {
    get: function() {
      return (this.status>399)
    },
    enumerable: true
  }
});

// TODO: Should only be mixing in the getters here
// -- the setter is only used in the constructor
_.extend(Response.prototype,HeaderMixins.Getters,HeaderMixins.Setters);
module.exports = Response;

