var vows = require('vows')
  , assert = require('assert')
  , Emitter = require("events").EventEmitter
  , _ = require("underscore")
  , Ax = require("ax")
  , log = new Ax({ level: "debug" })
  , H = require("../lib/surf/mixins/headers")
;

vows.describe('Surf Headers').addBatch({
  'An object that mixins in Getters and Setters': {
    topic: function() {
      
      var K = function(){}
        , promise = new(Emitter)
      ;
      H.Getters.mixWith(K);
      H.Setters.mixWith(K);
      
      return K;
    },
    "should be able to get and set a header": function(K){
      var object = new K();
      object.setHeader("Content-Type", "text/html");
      assert.equal(object._headers["Content-Type"], "text/html");
    },
    "should be able to set headers using an object": function(K) {
      var object = new K();
      var headers = {
        "Content-Type": "text/html",
        "Accept": "text/html,*/*",
        "Host": "foobar.com"
      };
      object.setHeaders(headers);
      assert.equal(object._headers["Content-Type"],headers["Content-Type"]);
      assert.equal(object._headers["Accept"],headers["Accept"]);
      assert.equal(object._headers["Host"],headers["Host"]);
    },
    "should be able to get headers as on object": function(K) {
      var object = new K();
      var headers = {
        "Content-Type": "text/html",
        "Accept": "text/html,*/*",
        "Host": "foobar.com"
      };
      object.setHeaders(headers);
      assert.equal(object._headers["Content-Type"],headers["Content-Type"]);
      assert.equal(object._headers["Accept"],headers["Accept"]);
      assert.equal(object._headers["Host"],headers["Host"]);
    }
  }
}).export(module);
