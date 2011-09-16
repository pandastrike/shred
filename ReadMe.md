## Introduction

Surf is an HTTP client library that makes writing clients fun and easy.

    // we'll omit this part in future examples
    var Surf = require("surf")
      , surfer = Surf.new()
      ;
  
    surfer.get({
      url: "http://shark.com/",
      headers: {
        accept: "application/json"
      },
      on: {
        response: function(response) {
          console.log(response.body.json.sessions.url);
        }
      }
    });

The response was JSON, but Surf handles that for you because we specified `application/json` in the `Accept` header. So we're able to access it via `response.body.json`.

Here's another example:

    surfer.post({
      url: home.sessions.url
      headers: {
        accept: shark.types["1.0"].session,
        contentType: shark.types["1.0"].application
      },
      body: {
        key: "1234567890" // your application key
      },
      on: {
        201: function(response) {
          console.log(response.body.json.notifications.channels.url);
        }
      }
    });

