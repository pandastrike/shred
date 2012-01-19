## Introduction

Shred is an HTTP client library for node.js and the browser.
Shred supports gzip, cookies, https, and redirects.

## Installation

# Node.js

Shred can be installed through npm.

    npm install shred

# Browsers

We use [Browserify](https://github.com/substack/node-browserify) to bundle Shred and all of its dependencies in one javascript file.
Simply include the bundled version of shred in a script tag.

    <script src="browser/shred.bundle.js" />

If you want smaller downloads, use the minified version.

    <script src="browser/shred.bundle.min.js" />

## Basic Usage

First we need to require the Shred library and instantiate a new client.

    var Shred = require("./shred");
    var shred = new Shred();

Then we can use `shred` to make HTTP requests.

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

```javascript
var req = shred.post({
  url: "http://localhost:8080/accounts
  headers: {
    Accept: "application/json",
    Content-Type: "application/json"
  },
  // Shred will JSON-encode PUT/POST bodies
  content: { username: "fred", email: "fred@flinstone.com },
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

Shred uses HTTP status codes as event names.
You can also add listeners to the "success" event, the "error" event, and the most generic "response" event.
Shred makes sure that only the most specific event handler gets called for a response.

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

## JSON Decoding

Shred will automatically decode JSON bodies if the response headers Content-Type identifies it as JSON.
Thus, we are able to get the to the decoded object with `response.content.data`.
The original string representation is still available to us, in `response.content.body`.

See [the wiki](https://github.com/spire-io/shred/wiki) for more examples.

Also, we wrote [a blog post][blog] on why we wrote Shred instead of going with existing libraries.


## Feedback

Feedback is highly encouraged in the form of [tickets][tickets] or pull requests. Thank you!

## Code

[Browse the annotated source.][docs]

We'd love [your contributions](repo) - don't hesitate to send us pull requests. We'll also happily add you as a committer after we've accepted it.

## License

Shred is MIT licensed.

## Authors

Shred is based on code originally written by [Matthew King][king]. That code was adapted and converted into a separate Node.js library by [Dan Yoder][yoder] and [Jason Campbell][campbell].

[code]: https://github.com/spire-io/shred
[tickets]: https://github.com/spire-io/shred/issues
[license]: https://github.com/spire-io/shred/blob/master/LICENSE
[yoder]: mailto:dan@spire.io
[king]: mailto:mking@spire.io
[campbell]: mailto:jason@spire.io
[docs]: http://www.spire.io/docs/shred/
[blog]: http://www.spire.io/posts/introducing-shred.html

