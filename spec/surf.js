var vows = require('vows')
  , assert = require('assert')
  , Emitter = require("events").EventEmitter
  , Ax = require("ax")
  , log = new Ax({ level: "debug" })
  , Surf = require("Surf")
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
    "should have a status code of 200": function(response){
      assert.equal(response.status, 200);
    },
    "should have a content type of 'text/plain'": function(response) {
      assert.equal(response.contentType, "text/plain");
    }
  }
}).export(module);
