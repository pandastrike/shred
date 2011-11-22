var HTTP = require("http")
  , HTTPS = require("https")
  , URL = require("url")
  , QueryString = require("querystring")
  , Emitter = require('events').EventEmitter
  , sprintf = require("sprintf").sprintf
  , _ = require("underscore")
  , Response = require("./response")
  , HeaderMixins = require("./mixins/headers")
  , Content = require("./content")
;

var Request = function(client, options) {


  this.client = client;
  this.log = client.log;

  Private.processOptions(this,options||{});
  Private.createRequest(this);

};

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
      this.scheme = _url.protocol.slice(0,-1);
      this.host = _url.hostname;
      this.port = _url.port;
      this.path = _url.pathname;
      this.query = _url.query;
      return this;
    },
    enumerable: true
  },

  headers: {
    get: function() { return this.getHeaders(); },
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
  // method
  // default to GET
  method: {
    get: function() {
      return this._method = (this._method||"GET");
    },
    set: function(value) {
      this._method = value; return this;
    },
    enumerable: true
  },

  // query
  // can be set with an object, which is converted to a query string
  // get returns the query string
  query: {
    get: function() {return this._query;},
    set: function(value) {
      if (value) {
        if (typeof value === 'object') {
          value = QueryString.stringify(value);
        } else {
          value = value.toString()
        }
      }
      if (value) { this._query = "?" + value; }
      else this._query = "";
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
      this._body = new Content({
        data: value,
        type: this.getHeader("Content-Type")
      });
      this.setHeader("Content-Type",this.content.type);
      this.setHeader("Content-Length",this.content.length);
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

// alias proprety: content to body
Object.defineProperty(Request.prototype,"content",
    Object.getOwnPropertyDescriptor(Request.prototype, "body"));

// Methods
_.extend(Request.prototype,{
  inspect: function() {
    var request = this;
    var headers = _(request.headers).reduce(function(array,value,key){
      array.push("\t" + key + ": " + value); return array;
    },[]).join("\n");
    var summary = ["<Shred Request> ", request.method.toUpperCase(),
        request.url].join(" ")
    return [ summary, "- Headers:", headers].join("\n");
  },
  send: function() {

  }
});

var Private = {
  processOptions: function(request,options) {

    request.log.debug("Processing request options ..");

    request.emitter = (new Emitter);
    
    if (options.on) {
      _(options.on).each(function(value,key) {
        request.emitter.on(key,value);
      });
    } else throw("No event handlers provided. Response will be unused.");

    // Make sure we were give a URL or a host
    if (!options.url && !options.host) {
      request.emitter.emit("Error",
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
    request.setHeader("User-Agent","Shred for Node.js, Version 0.1.0");
    request.setHeaders(options.headers);
    if (options.body||options.content) {
      request.content = options.body||options.content;
    }
    request.timeout = options.timeout;

  },
  createRequest: function(request) {
    var timeout
      , shred = request.client
    ;

    request.log.debug("Creating request ..");
    request.log.debug(request);
    var http = request.scheme == "http" ? HTTP : HTTPS;
    request._raw = http.request({
      host: request.host,
      port: request.port,
      method: request.method,
      path: request.path+request.query,
      headers: request.getHeaders()
    }, function(response) {

      request.log.debug("Received response ..");

      // okay, we haven't timed out and we have a response
      clearTimeout(timeout);

      response = new Response(response, request, function(response) {
        var emit = function(event) {
          if (request.emitter.listeners(response.status).length>0) {
            request.emitter.emit(response.status,response);
          } else {
            if (request.emitter.listeners(event).length>0) {
              request.emitter.emit(event,response);
            } else if (!response.isRedirect) {
              request.emitter.emit("response",response);
            }
          }
        };
        if (response.isRedirect) {
          // just repeat the request with the new url
          request.log.debug("Redirecting to "
              + response.getHeader("Location"));
          request.url = response.getHeader("Location");
          emit("redirect");
          Private.createRequest(request);
        } else if (response.isError) { 
          emit("error");
        } else { // no error, no redirect
          emit("success");
        }
      });
    });

    request._raw.on("error", function(error) {
      request.log.error("Request failed: " + error.message);
    });

    if (request.content) {
      request.log.debug("Streaming body: '" +
          request.content.body.slice(0,59) + "' ... ");
      request._raw.write(request.content.body);
    }

    if (request.timeout) {
      timeout = setTimeout(function() {
        request.log.debug("Timeout fired, aborting request ...");
        request._raw.abort();
        request.emit("timeout", request);
      },request.timeout);
    }

    // this will start the request
    request.log.debug("Sending request ...");
    request._raw.end();
  }
};

HeaderMixins.Getters.mixWith(Request);
HeaderMixins.Setters.mixWith(Request);

module.exports = Request;
