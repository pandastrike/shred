# Introduction

Shred is an HTTP client library for node.js and browsers.
Shred supports gzip, cookies, https, proxies, and redirects.

# Installation

## Node.js

Shred can be installed through npm.

    npm install shred

## Browsers

We use [Browserify](https://github.com/substack/node-browserify) to bundle Shred and all of its dependencies in one javascript file.
Simply include the bundled version of shred in a script tag.

    <script src="browser/shred.bundle.js" />

If you want smaller downloads, use the minified version.

    <script src="browser/shred.bundle.min.js" />

# Basic Usage

First we need to require the Shred library and instantiate a new client.

Browser:

    var Shred = require("./shred");
    var shred = new Shred();

Node.js:

    var Shred = require("shred");
    var shred = new Shred();

Then we are ready to use `shred` to make HTTP requests.

## Simple GET request

Here is a simple GET request that gets some JSON data.


```javascript
var req = shred.get({
  url: "http://api.spire.io/",
  headers: {
    Accept: "application/json"
  },
  on: {
    // You can use response codes as events
    200: function(response) {
      // Shred will automatically JSON-decode response bodies that have a
      // JSON Content-Type
      console.log(response.content.data);
    },
    // Any other response means something's wrong
    response: function(response) {
      console.log("Oh no!");
    }
  }
});
```

## Response Handling

Shred uses HTTP status codes as event names.
The above example has a handler for when the response comes back with status 200, and a catch-all "request" handler for all other cases.

You can also add listeners to the "success" event, the "error" event, and the most generic "response" event.
Shred makes sure that only the most specific event handler gets called for a response.

## JSON Decoding

Shred will automatically decode JSON bodies if the response headers' Content-Type identifies it as JSON.
Thus, we are able to get the to the decoded object with `response.content.data`.
The original string representation is still available to us, in `response.content.body`.

Here is a POST to an accounts resource.
Shred will automatically JSON-encode the POST body.
We have handlers for the 201 "Created" status, 409 "Conflict" status, and a catch-all "response" handler.

## Simple POST request

```javascript
var req = shred.post({
  url: "http://localhost:8080/accounts",
  headers: {
    Content-Type: "application/json"
  },
  // Shred will JSON-encode PUT/POST bodies
  content: { username: "fred", email: "fred@flinstone.com" },
  on: {
    // you can use response codes as events
    201: function(response) {
      console.log("User Created");
    },
    409: function (response) {
      console.log("User with that name already exists.");
    },
    response: function(response) {
      // We got a 40X that is not a 409, or a 50X
      console.log("Oh no, something went wrong!");
    }
  }
});
```

You can pass listeners directly into the shred request call, as in the above examples, or add listeners to the request with the `on` method:

```javascript
req.on({
  404: function(response) {
    console.log("Not Found");
  },
  500: function(response) {
    console.log("Server Error, please try again later.");
  }
});
```

You can also chain the events with 'on', if that's your style.

```javascript
req.on(
  404,
  function(response) {
    console.log("Not Found");
}).on(500 function(response) {
    console.log("Server Error, please try again later.");
});
```

See [the wiki](https://github.com/spire-io/shred/wiki) for more examples.

Also, we wrote [a blog post][blog] on why we wrote Shred instead of going with existing libraries.

# Interface

Shred has 4 methods: `shred.get`, `shred.put`, `shred.delete`, and `shred.post`.

## Request Options

* `url`: url to make the request to
* `headers`: hash of headers to send with the request
* `port`: port to send the request to
* `query`: hash or string to send as the query parameters
* `content`: data to send in the body of the request (also aliased to `body`)
* `timeout`: length of time in ms to wait before killing the connection
* `proxy`: url of http proxy to use

## Events

Shred will fire an event with the status code of the response, if that event has any listeners.
If the status code has no listeners, Shred will fire the "success" event or the "error" event, depending on whether the http response is a success (2XX) or error (4XX and 5XX).
If the success/error event has no listeners, Shred will fire the most generic "response" event.

Shred will also emit a "request_error" event if the request errors out before a response comes back.

## Response

The response is passed as the only argument to the event listeners.
It has the following properties.

* `response.status`: status code of the response
* `response.isError`: true iff the status code is >= 400
* `response.content.body`: string representation of the response body
* `response.content.data`: javascript object for the response body (if the Content-Type is JSON)

# Feedback

Feedback is highly encouraged in the form of [tickets][tickets] or pull requests. Thank you!

# Code

[Browse the annotated source.][docs]

We'd love [your contributions](repo) - don't hesitate to send us pull requests. We'll also happily add you as a committer after we've accepted it.

# Tests

    cake test

# License

Shred is MIT licensed.

# Authors

Shred is based on code originally written by [Matthew King][king].
That code was adapted and converted into a separate Node.js library by [Dan Yoder][yoder], [Jason Campbell][campbell], [Nick LaCasse][lacasse], and [Vicent Piquer Suria][suria].

[code]: https://github.com/spire-io/shred
[tickets]: https://github.com/spire-io/shred/issues
[license]: https://github.com/spire-io/shred/blob/master/LICENSE
[yoder]: mailto:dan@spire.io
[king]: mailto:mking@spire.io
[campbell]: mailto:jason@spire.io
[lacasse]: mailto:nlacass@spire.io
[suria]: mailto:vsuria@spire.io
[docs]: http://www.spire.io/docs/shred/
[blog]: http://www.spire.io/posts/introducing-shred.html

