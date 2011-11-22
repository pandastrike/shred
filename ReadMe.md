## Introduction

Shred is an HTTP client library for node.js that makes writing clients fun and easy.

    var Shred = require("shred")
      , shred = new Shred
      ;
  
    shred.get({
      url: "http://api.spire.io/",
      headers: {
        accept: "application/json"
      },
      on: {
        // you can use response codes as events
        200: function(response) {
          console.log(response.content.data);
        },
        // any other response means something's wrong
        response: function(response) {
          console.log("Oh no!");
        }
      }
    });

The response was JSON, but Shred handles that for you because we specified `application/json` in the `Accept` header. So we're able to access it via `response.content.data`.

See http://www.spire.io/docs/tutorials/rest-api.html for more examples.

## Installation

Just `npm install shred` and you're good to go.

## Feedback

Feedback is highly encouraged in the form of [tickets][tickets] or pull requests. Thank you!

[tickets]: https://github.com/spire-io/shred/issues