var vows = require('vows')
  , assert = require('assert')
  , Surf = require('../lib/surf')
;

vows.describe('Surf').addBatch({
  '#get(options)': {
    topic: function(){
      return new Surf();
    },
    'should be defined': function(surfer){
      assert.ok(surfer.get);
    },
    'should not throw': function(surfer){
      // surfer.get();
      // surfer.get({}); // errs but doesn't throw ?

      assert.doesNotThrow(function(){
        surfer.get({
          url: "http://waves.io/",
          headers: {
            accept: "application/json",
            origin: "http://yourdomain.com"
          },
          on: {
            response: function(response) {
              resources = response.content.data;
              assert.ok(resources.sessions.url);
            }
          }
        });

      });
    }
  }
}).export(module);