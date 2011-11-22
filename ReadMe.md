## Introduction

Shred is an HTTP client library that makes writing clients fun and easy.

    var Shred = require("shred")
      , shred = Shred.new()
      ;
  
    shred.get({
      url: "http://api.spire.io/",
      headers: {
        accept: "application/json"
      },
      on: {
        response: function(response) {
          console.log(response.content.data);
        }
      }
    });

The response was JSON, but Shred handles that for you because we specified `application/json` in the `Accept` header. So we're able to access it via `response.content.data`.

See http://www.spire.io/docs/tutorials/rest-api.html for more examples.

