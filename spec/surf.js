var vows = require('vows')
  , assert = require('assert')
  , Emitter = require("events").EventEmitter
  , Ax = require("ax")
  , log = new Ax({ level: "debug", file: "log/specs/surf.log" })
  , Surf = require("surf")
;

vows.describe('Surf').addBatch({
  'A minimal valid GET request': {
    topic: function() {
      
      var surfer = new Surf({ logger: log })
        , promise = new(Emitter)
      ;
      
      surfer.get({
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
  'A minimal valid POST request': {
    topic: function() {
      
      var surfer = new Surf({ logger: log })
        , promise = new(Emitter)
      ;
      
      surfer.post({
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
      
      var surfer = new Surf({ logger: log })
        , promise = new(Emitter)
      ;
      
      surfer.post({
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
      
      var surfer = new Surf({ logger: log })
        , promise = new(Emitter)
      ;
      surfer.post({
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
      
      var surfer = new Surf({ logger: log })
        , promise = new(Emitter)
      ;
      surfer.get({
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
  }
  
  
  
  
}).export(module);
