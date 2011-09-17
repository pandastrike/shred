var http = require("http")
  , net = require("net")
  , url = require("url")
  , util = require("util")
  , EventEmitter2 = require("eventEmitter2").EventEmitter2
  , _ = require("underscore")
;

var Surf = function(options) {
  this.options = options;
};

util.inherits(Surf, EventEmitter2);

var createHTTPRequest = function(options) {
  
  var request = http.request(options);

  // appears to be magic ... why is this here?
  request.agent.maxSockets = 8;

  return request;
};

var bodyProcessors =  {
  "application/json": function(body) { return JSON.stringify(body); },
};

var processRequestBody = function(options) {
  var processor = bodyProcessor[options.headers["Content-Type"]];
  if (processor) { return processor(options.body); }
  else { return options.body; }
};

var converTimeoutToMilliseconds = function(options,timeout) {
  
};

var Methods = {
  request: function(options) {

    var surfer = this
      , timeout
      , responseHandler = function(request) {
      
      }
      , errorHandler = function(request) {
          if (options.timeout) { clearTimeout(timeout); }
      
      }
      , request = createHTTPRequest(_.defaults(options,this.options))
    
    ;


    if (options.body) { request.write(processRequestBody(options)); }
    request.end();


    if (options.timeout) {
      timeout = setTimeout(function() {
        request.abort();
        surfer.emit("timeout",surfer);
      },convertTimeoutToMillseconds(options.timeout));
    }
    
    request.on("response", responseHandler);

    request.on("error", errorHandler);
    
    return surfer;
    
  }
  
};

// Ah, Ruby ...
"GET PUT POST DELETE".split(" ").forEach(function(method) {
  Methods[method] = Methods[method.toLowerCase(method)] = function(options) {
    options.method = method;
    return this.request(options);
  };
});

_.extend(Surf.prototype,Methods);

module.exports = Surf;