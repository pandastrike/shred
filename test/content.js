var vows = require('vows')
  , assert = require('assert')
  , Emitter = require("events").EventEmitter
  , Ax = require("ax")
  , log = new Ax({ level: "debug", file: "log/specs/content.log" })
  , Content = require("../lib/shred/content")
;

vows.describe('Shred Content').addBatch({
  'An content object constructed with a body and no type': {
    topic: function() {
      return new Content({body: "Hello" });
    },
    "should have a default type of 'text/plain'": function(content){
      assert.equal(content.type,"text/plain");
    },
    "should have a data property equal to the body": function(content) {
      assert.equal(content.body, content.data);
    },  
    "should have a length property equal to the length of the body": function(content) {
      assert.equal(content.length, content._body.length);
    }  
  },
  "An content object constructed with a body and type of 'text/html'": {
    topic: function() {
      return new Content({type: "text/html", body: "HELLO" });
    },
    "should have a default type of 'text/html'": function(content){
      assert.equal(content.type,"text/html");
    },
    "should have a data property equal to the body": function(content) {
      assert.equal(content.body, content.data);
    }  
  },
  "An content object constructed with JSON and no type": {
    topic: function() {
      return new Content({data: { foo: "HELLO" } });
    },
    "should have a default type of 'application/json'": function(content){
      assert.equal(content.type,"application/json");
    },
    "should have a body property equal to the stringified data": function(content) {
      assert.equal(typeof content.body, 'string');
      assert.equal(content.body, JSON.stringify(content.data));
    },
    "should have a length property equal to the length of the body": function(content) {
      assert.equal(content.length, content.body.length);
    }  
  },
  "An content object constructed with a complex MIME type": {
    topic: function() {
      return new Content({
          type: "application/vnd.foo.baz+json;version=1.0",
          data: { foo: "HELLO" } });
    },
    "should have a body property equal to the stringified data": function(content) {
      assert.equal(typeof content.body, 'string');
      assert.equal(content.body, JSON.stringify(content.data));
    },
    "should have a length property equal to the length of the body": function(content) {
      assert.equal(content.length, content.body.length);
    }  
  }
  
}).export(module);
