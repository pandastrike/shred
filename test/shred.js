var vows = require('vows')
  , assert = require('assert')
  , Emitter = require("events").EventEmitter
  , Ax = require("ax")
  , log = new Ax({ level: "debug", file: "log/specs/shred.log" })
  , Shred = require("../lib/shred")
;

vows.describe('Shred').addBatch({
  'A minimal valid GET request': {
    topic: function() {
      
      var shred = new Shred({ logger: log })
        , promise = new(Emitter)
      ;
      
      var req = shred.get({
        url: "http://localhost:1337/200",
        on: {
          response: function(response) {
            promise.emit("success", response);
          },
          error: function(error) {
            log.debug(error);
            log.info("Is rephraser running?")
          }
        }
      });
      return promise;
    },
    "should have a response status code of 200": function(response){
      assert.equal(response.status, 200);
    },
    "should have no content type": function(response) {
      assert.equal(!!response.content.data.headers["Content-Type"],false);
    },
  },
  'A minimal valid POST request': {
    topic: function() {
      
      var shred = new Shred({ logger: log })
        , promise = new(Emitter)
      ;
      
      shred.post({
        url: "http://localhost:1337/200",
        on: {
          response: function(response) {
            promise.emit("success",response);
          },
          error: function(error) {
            log.debug(error);
            log.info("Is rephraser running?")
          }
        }
      });
      
      return promise;
    },
    "should have a response status code of 200": function(response){
      assert.equal(response.status, 200);
    },
    "should have no content type": function(response) {
      assert.equal(!!response.content.data.headers["Content-Type"],false);
    }
  },
  'A POST request with a body': {
    topic: function() {
      
      var shred = new Shred({ logger: log })
        , promise = new(Emitter)
      ;
      
      shred.post({
        url: "http://localhost:1337/200",
        body: "Hello",
        on: {
          response: function(response) {
            promise.emit("success",response);
          },
          error: function(error) {
            log.debug(error);
            log.info("Is rephraser running?")
          }
        }
      });
      
      return promise;
    },
    "should have a response status code of 200": function(response){
      assert.equal(response.status, 200);
    },
    "should have a default content type of 'text/plain'": function(response) {
      assert.equal(
        response.content.data.headers["Content-Type"],
        "text/plain");
    }
  },
  "A POST request with a content type of 'application/json body that returns a 201": {
    topic: function() {
      
      var shred = new Shred({ logger: log })
        , promise = new(Emitter)
      ;
      shred.post({
        url: "http://localhost:1337/201",
        body: {foo: 1, bar: 2},
        on: {
          response: function(response) {
            promise.emit("success",response);
          },
          error: function(error) {
            log.debug(error);
            log.info("Is rephraser running?")
          }
        }
      });
      
      return promise;
    },
    "should have a response status code of 201": function(response){
      assert.equal(response.status, 201);
    },
    "should include a Location header in the response": function(response) {
      assert.equal(!!response.getHeader("Location"),true);
    },
    "should have a default content type of 'application/json'":
      function(response) {
      assert.equal(
        response.content.data.headers["Content-Type"],
        "application/json");
    }
  },
  "A GET request to a redirected URL": {
    topic: function() {
      
      var shred = new Shred({ logger: log })
        , promise = new(Emitter)
      ;
      shred.get({
        url: "http://localhost:1337/301",
        on: {
          response: function(response) {
            promise.emit("success",response);
          },
          error: function(error) {
            log.debug(error);
            log.info("Is rephraser running?")
          }
        }
      });
      
      return promise;
    },
    "will transparently handle the redirect": function(response){
      assert.equal(response.status, 200);
    }
  },
  "A request with an event handler based on the status code": {
    topic: function() { 
      var shred = new Shred({ logger: log })
        , promise = new(Emitter)
      ;
      
      var handleCount = 0;
      
      var req = shred.get({
        url: "http://localhost:1337/200",
        on: {
          200: function(response) {
            handleCount++;
            if (handleCount == 2) {
              promise.emit("success", response, handleCount);
            }
          },
          error: function(error) {
            log.debug(error);
            log.info("Is rephraser running?")
          }
        }
      });
      
      req.on(200, function(response) {
        handleCount++;
        if (handleCount == 2) {
          promise.emit("success", response, handleCount);
        }
      })
      
      return promise;
    },
    "will trigger the correct callback": function(response) {
      assert.equal(response.status,200);
    },
    "can have multiple callbacks": function(err, response, count) {
      assert.equal(count, 2);
    }
  },
  'A GET request with multiple "response" handlers': {
    topic: function() {
      
      var shred = new Shred({ logger: log })
        , promise = new(Emitter)
      ;
      
      var handleRunCount = 0;
      var numberOfHandlers = 0;

      var createHandlerFunction = function () {
        numberOfHandlers ++;
        return function (response) {
          handleRunCount++;
          if (handleRunCount == numberOfHandlers) {
            promise.emit("success", response, numberOfHandlers, handleRunCount);
          }
        };
      };

      var req = shred.get({
        url: "http://localhost:1337/200",
        // Handler defined in the request options hash
        on: {
          response: createHandlerFunction(),
          error: function(error) {
            log.debug(error);
            log.info("Is rephraser running?")
          }
        }
      });

      // Handler without an event name
      req.on(createHandlerFunction());

      // Handler with an event name
      req.on('response', createHandlerFunction());

      // Handler with a hash of event names
      req.on({
        response: createHandlerFunction()
      });

      return promise;
    },
    "should be able to have multiple handlers": function(err, response, numberOfHandlers, handleRunCount) {
      // Sanity check to make sure that there are handlers:
      assert.notEqual(0, numberOfHandlers);
      assert.notEqual(1, numberOfHandlers);
    },
    "should run all of the handlers": function (err, response, numberOfHandlers, handleRunCount) {
      assert.equal(handleRunCount, numberOfHandlers);
    }
  },
  'A valid GET request with multiple listeners': {
    topic: function() {
      
      var shred = new Shred({ logger: log })
        , promise = new(Emitter)
      ;
      var numberOfFiredCallbacks = 0;
      
      var req = shred.get({
        url: "http://localhost:1337/200",
        on: {
          200: function(response) {
            numberOfFiredCallbacks++
            if (numberOfFiredCallbacks === 1){
              response.fired200 = true;
              promise.emit("success", response);
            }
          },
          success: function(response) {
            numberOfFiredCallbacks++;
            if (numberOfFiredCallbacks === 1){
              response.firedSuccess = true;
              promise.emit("success", response);
            }
          },
          response: function(response) {
            numberOfFiredCallbacks++;
            if (numberOfFiredCallbacks === 1){
              response.firedResponse = true;
              promise.emit("success", response);
            }
          },
          error: function(error) {
            log.debug(error);
            log.info("Is rephraser running?")
          }
        }
      });
      return promise;
    },
    "should have a response status code of 200": function(response){
      assert.equal(response.status, 200);
    },
    "should fire the '200' listener": function(response) {
      assert.equal(response.fired200,true);
    },
    "should NOT fire the 'success' listener": function(response) {
      assert.equal(response.firedSuccess,null);
    },
    "should NOT fire the 'response' listener": function(response) {
      assert.equal(response.firedResponse,null);
    }
  },
  'A failing GET request (caused by an HTTP error) with multiple listeners': {
    topic: function() {
      
      var shred = new Shred({ logger: log })
        , promise = new(Emitter)
      ;
      var numberOfFiredCallbacks = 0;
      
      var req = shred.get({
        url: "http://localhost:1337/404",
        on: {
          404: function(response) {
            numberOfFiredCallbacks++
            if (numberOfFiredCallbacks === 1){
              response.fired404 = true;
              promise.emit("success", response);
            }
          },
          error: function(response) {
            numberOfFiredCallbacks++;
            if (numberOfFiredCallbacks === 1){
              response.firedError = true;
              promise.emit("success", response);
            }
          },
          response: function(response) {
            numberOfFiredCallbacks++;
            if (numberOfFiredCallbacks === 1){
              response.firedResponse = true;
              promise.emit("success", response);
            }
          }
        }
      });
      return promise;
    },
    "should have a response status code of 404": function(response){
      assert.equal(response.status, 404);
    },
    "should fire the '404' listener": function(response) {
      assert.equal(response.fired404,true);
    },
    "should NOT fire the 'error' listener": function(response) {
      assert.equal(response.firedError,null);
    },
    "should NOT fire the 'response' listener": function(response) {
      assert.equal(response.firedResponse,null);
    }
  },
  'A failing GET request not caused by an HTTP error': {
    topic: function() {

      var shred = new Shred({ logger: log })
        , promise = new(Emitter)
      ;
      var requestErrorFired = false;

      var req = shred.get({
        url: "http://localhost:1337/timeout",
        on: {
          success: function (response) {
            console.log("success");
          },
          error: function (response) {
            console.log("we got an http error");
          },
          request_error: function (requestErrorFired) {
            requestErrorFired = true;
            promise.emit("success", requestErrorFired);
            console.error("something went very wrong! request was not made!")
          }
        }
      });

      // Set the socket timeout to something low, so we don't wait the defaults
      // 2 minutes for the request to timeout
      req._raw.on('socket', function () {
        req._raw.socket.setTimeout(200);
      });

      return promise;
    },
    "should fire the 'request_error' listener": function(response, requestErrorFired) {
      assert.equal(requestErrorFired,true);
    }
  }
}).export(module);
