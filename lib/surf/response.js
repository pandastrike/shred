var _ = require("underscore")
  , Content = require("surf/content")
;

var Response = function(raw,callback) { 
  var response = this;
  this._raw = raw; 
  var body = "";
  raw.on("data", function(data) { body += data; });
  raw.on("end", function() {
    this.body = body;
    callback(response);
  });
};

Response.prototype = {
  get status() { return this._raw.statusCode; },
  get headers() { return this._raw.headers; },
  get body() { return this._body; },
  set body(value) {
    this._body = new Content(value);
  },
  get isRedirect() {
    return (this.status>299
        &&this.status<400
        &&this.headers.location);
  },
  inspect: function() {
    var response = this;
    var headers = _(response.headers).reduce(function(array,value,key){
      array.push("\t" + key + ": " + value); return array;
    },[]).join("\n");
    var summary = ["<Surf Response> ", response.status].join(" ")
    return [ summary, "- Headers:", headers].join("\n");
  }
};

module.exports = Response;

