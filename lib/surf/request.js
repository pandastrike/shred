var util = require("util")
  , HTTP = require("http")
  , URL = require("url")
  , QueryString = require("querystring")
  , EventEmitter2 = require("eventemitter2").EventEmitter2
  , sprintf = require("sprintf").sprintf
  , _ = require("underscore")
  , Response = require("surf/response")
  , Content = require("surf/content")
;

var Request = function(client, options) {
  
  // call our superclass constructor ...
  EventEmitter2.call(this);
  
  this.client = client;

  Private.processOptions(this,options);
  Private.createRequest(this);

};

util.inherits(Request,EventEmitter2);

Object.defineProperties(Request.prototype, {
  
  url: {
    get: function() {
      if (!this.scheme) { return null; }
      return sprintf("%s://%s:%s%s",
          this.scheme, this.host, this.port,
          (this.proxy ? "/" : this.path) + 
          (this.query ? ("?" + this.query) : ""));
    },
    set: function(_url) {
      _url = URL.parse(_url);
      this.scheme = _url.protocol;
      this.host = _url.host;
      this.port = _url.port;
      this.path = _url.pathname;
      this.query = _url.query;
      return this;
    },
    enumerable: true
  },

  // port -
  // defaults based on the scheme
  port: {
    get: function() {
      if (!this._port) {
        switch(this.scheme) {
          case "https": return this._port = 443;
          case "http":
          default: return this._port = 80;
        }
      }
      return this._port;
    },
    set: function(value) { this._port = value; return this; },
    enumerable: true
  },
  
  // headers
  // takes a hash, will default it to include the Host and Content-Type
  headers: {
    get: function() {
      return this._headers = (this._headers||{ 
        "Content-Type": "text/plain",
        "Host": this.host 
      });
    },
    set: function(value) { 
      if (value) this._headers = value;
      return this; 
    },
  },
  contentType: {
    get: function() {
      return this.headers["Content-Type"];
    }
  },
  
  // method
  // default to GET
  method: {
    get: function() {
      return this._method = (this._method||"GET");
    },
    set: function(value) { 
      if (value) this._method = value; return this; 
    },
    enumerable: true
  },
  
  // query
  // can be set with an object, which is converted to a query string
  // get returns the query string
  query: {
    get: function() {
       return this._query = (this._query||"");
    },
    set: function(value) {
      this._query = (value instanceof String) ? value :
        QueryString.stringify(value);
      return this;
    },
    enumerable: true
  },
  
  // parameters
  // get only - returns the object representation of the query
  parameters: {
    get: function() { return QueryString.parse(this._query); },
    enumerable: true
  },
  
  // body
  // set will automatically construct a Content object 
  // get returns the Content object
  body: {
    get: function() { return this._body; },
    set: function(value) {
      this._body = new Content(value,this.contentType);
      return this;
    },
    enumerable: true
  },
  
  // timeout
  // set will take either milliseconds or an object with 
  // temporal attributes (hours, minutes, seconds) and
  // convert it into milliseconds
  timeout: {
    get: function() { return this._timeout; }, // in milliseconds
    set: function(timeout) {
      var request = this
        , milliseconds = 0;
      ;
      if (!timeout) return this;
      if (typeof options=="number") { milliseconds = options; }
      else {
        milliseconds = (options.milliseconds||0) + 
          (1000 * ((options.seconds||0) +
              (60 * ((options.minutes||0) + 
                (60 * (options.hours||0))))));
      }
      this._timeout = milliseconds;
      return this;
    },
    enumerable: true
  }
});

// Methods
_.extend(Request.prototype,{
  inspect: function() {
    var request = this;
    var headers = _(request.headers).reduce(function(array,value,key){
      array.push("\t" + key + ": " + value); return array;
    },[]).join("\n");
    var summary = ["<Surf Request> ", request.method.toUpperCase(),
        request.url].join(" ")
    return [ summary, "- Headers:", headers].join("\n");
  },
  send: function() {
    
  }
});

var Private = {
  processOptions: function(request,options) {
    
    // Make sure we were give a URL or a host
    if (!options.url && !options.host) {
      emit("Error",
          new Error("No url or url options (host, port, etc.)"));
    } 

    if (options.url) {
      if (options.proxy) {
        request.url = options.proxy;
        request.path = options.url;
      } else {
        request.url = options.url;
      }
    }

    request.query = options.query||options.parameters;
    request.method = options.method;
    request.headers = options.headers;
    request.body = options.body;
    request.timeout = options.timeout;

    if (options.on) {
      _(options.on).each(function(value,key) {
        request.on(key,value);
      });
    }
  },
  createRequest: function(request) {
    var timeout
      , surfer = request.client
    ;
    request._raw = HTTP.request(Object.create(request));
    request._raw.on("response", function(response) {

      // okay, we haven't timed out and we have a response
      clearTimeout(timeout);

      response = new Response(response, function(response) {
        if (response.isRedirect) {
          // just repeat the request with the new url
          request.url = response.headers.location;
          Private.createRequest(request);
        } else if (response.isError) { 
          request.emit("error", response ); 
        } else { // no error, no redirect
          request.emit("response",response)
        }
      });
    });
    
    if (request.body) {
      request._raw.write(request.body.toString());
    }
    if (request.timeout) {
      timeout = setTimeout(function() {
        request._raw.abort();
        request.emit("timeout", request);
      },request.timeout);
    }
    
    // this will start the request
    request._raw.end();
  }
};

module.exports = Request;
