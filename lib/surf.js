var HTTP = require("http")
  , Net = require("net")
  , URL = require("url")
  , util = require("util")
  , EventEmitter2 = require("eventEmitter2").EventEmitter2
  , _ = require("underscore")
;

var Surf = function(options) {
  this.options = options;
};

util.inherits(Surf, EventEmitter2);

var createHTTPRequest = function(_options) {
  
  // will use this to store the options we will pass to the Node.js
  // HTTP client. _options are the options passed into us.
  var options = {};

  // Make sure we were give a URL or a host
  if (!_options.url && !_options.host) {
    throw new Error("No url or host given")
  } 
  
  // Okay, we have a URL. Let's get the host, port, etc. from it
  
  // Are we using a proxy? If so, process the proxy url, instead
  // and pass the options URL as the path. See:
  //   http://www.jmarshall.com/easy/http/#proxies
  // for the convention we're using here
  if (_options.proxy) {
    _.extend(options, processURL(_options.proxy));
    options.path = _options.url;
  } else {
    _.extend(options,processURL(_options.url))
  }
  
  // let's set some nice defaults
  options.method = _options.method||"GET";
  options.headers = _options.headers||{};
  options.headers.Host = options.host;

  // okay, make the request and return it;
  // writing the body is done elsewhere
  var request = HTTP.request(options);
  return request;

};

var bodyProcessors =  {
  "application/json": {
    to: function(body) { return JSON.stringify(body); },
    from: function(body) { return JSON.parse(body); }
  }
};

var processBody = function(body,contentType) {
  var processor = bodyProcessors[contentType];
  return ( !processor ? body :
    (( body instanceof String ) ? 
        process.from(body) : process.to(body)));
};

var processURL = function(url) {
  // check for a URL object instead of a string
  if (!url instanceof String) return url;
  // okay, we have a string, parse it
  else {
    url = URL.parse(url);
    // doesn't default for the port for some reason
    if (!url.port) {
      switch(url.protocol) {
        case "https": url.port = 443; break;
        case "http":
        default: url.port = 80;
      }
    }
  }
  return url;
}

var converTimeoutToMilliseconds = function(options) {
  if (typeof options=="number") { return options; }
  options.hours = options.hours||0;
  options.minutes = (options.minutes||0)+(60*options.hours)
  options.seconds = (options.seconds||0)+(60*options.minutes);
  return (options.milliseconds||0)+(1000*options.seconds);
};

var Methods = {
  request: function(options) {

    var surfer = this
      , timeout
      , responseHandler = function(response) {
        // okay, we haven't timed out and we have a response
        clearTimeout(timeout);
        
        // check for a redirect
        if (response.statusCode>299
            &&response.statusCode<400
            &&response.headers.location) {
          // just repeat the request with the new url
          options.url = response.headers.location;
          // remove callbacks - they're already set
          options.on = null;
          surfer.request(options);
        } else if (response.status>399) { // error
          surfer.emit("error",{
            status: response.statusCode,
            headers: response.headers
          });
        } else {
          var body = "";
          response.on("data", function(data) {
            body += data;
          });
          response.on("end", function() {
            surfer.emit("response", {
              status: response.statusCode,
              headers: response.headers,
              body: processBody(body,response.headers["Content-Type"])
            });
          });
        }
      }
      , request = createHTTPRequest(_.defaults(options,this.options))
    ;


    if (options.body) {
      request.write(processBody(
          options.body,
          options.headers["Content-Type"]));
    }
    request.end();

    if (options.timeout) {
      timeout = setTimeout(function() {
        request.abort();
        surfer.emit("timeout",surfer);
      },convertTimeoutToMillseconds(options.timeout));
    }
    
    if (options.on) {
      _(options.on).each(function(value,key) {
        surfer.on(key,value);
      });
    }
    
    request.on("response", responseHandler);
    
    return surfer;
    
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