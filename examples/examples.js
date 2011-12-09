// # Introduction
//
// Shred is an HTTP client library intended to simplify the use of Node's
// built-in HTTP library. In particular, we wanted to make it easier to interact
// with HTTP-based APIs.
//
// # A Simple Example
//
// Let's start simple. We're going to use the <a class="logo" href="/">spire<span
// class="grey">.</span><span class="blue">io</span></a> API as our example.
// Let's begin by getting the documentation for the API as HTML.

// First, we need to instantiate a Shred instance. We can re-use this instance
// over any number of requests. The main purpose of creating an instance is to
// make it possible for you to provide default options that will be applied
// across each request for that instance. Later, we also expect to allow you to
// manage connections on a per-instance basis.
//
// For these examples, however, a simple Shred instance will work fine.
var Shred = require("shred");
var surf = new Shred;

// We're going to check our responses with `assert`.
var assert = require("assert");

// So now let's get that documentation:
//
// We have to let the <a class="logo" href="/">spire<span
// class="grey">.</span><span class="blue">io</span></a> API know that we want
// the docs as HTML.
surf.get({
  url: "http://api.spire.io",
  headers: {
    accept: "text/html"
  },
  on: {
    // Response events can be specified in terms of response codes. More specific
    // events have precedence.
    200: function(response) {
      assert.ok(response.content.body);
      console.log("√ Got API description as HTML");
    },
    // Here, `200` takes precedence over the more generic `response` event. This
    // allows us to avoid writing code like:
    //
    //     if (response.status!=200) { // etc. 
    //
    response: function(response) {
      console.log("We got something besides a 200 response!")
    }
  }
});

// We can also chain response handlers and have many handlers
// for the generic 'response' event.
surf.get({
  url: "http://api.spire.io",
  headers: {
    accept: "text/html"
  }
}).on(200, function(response) {
  assert.ok(response.content.body);
  console.log("√ Got API description as HTML");
}).on(function(response) {
  console.log("We got something besides a 200 response!");
}).on(function(response) {
  console.log("I'm not so happy about this non 200 response. Launch the missiles!");
});

// # Data Conversion
//
// Shred provides a very helpful facility for converting content entities to and
// from Javascript data types. The conversion is based on the content type of the
// entity.
//
// Let's try asking for the API description as `application/json`:

// First, let's declare a couple of variables we'll be using in later examples.
var resources, schema;

surf.get({
  url: "http://api.spire.io",
  headers: {
    accept: "application/json"
  },
  on: {
    // This time, instead of asking for `response.content.body` we'll ask for
    // `response.content.data`. Since Shred knows we asked for JSON, it will
    // attempt to parse the response content as JSON.
    200: function(response) {
      assert.ok(response.content.data);
      // We can treat this as an ordinary Javascript object:
      assert.ok(response.content.data.resources.sessions.url);
      // Let's save some of this for later.
      resources = response.content.data.resources;
      schema = response.content.data.schema["1.0"];
      console.log("√ Got API description as JSON");
    },
    response: function(response) {
      console.log("We got something besides a 200 response!")
    }
  }
});

// We can do the same trick to `PUT` or `POST` a Javascript object. Let's go
// ahead and use our session key to create a new session.

// This time, we're going to wrap our call to Shred in a function, so that we can
// use it in a callback.

var createSession = function() {
  surf.post({
    url: resources.sessions.url,
    headers: {
      accept: schema.session.mediaType,
      // Shred will automatically normalize the header names for you. Here,
      // `content_type` will be normalized to `Content-Type`.
      content_type: schema.account.mediaType
    },
    // This is the new bit. We just pass a Javascript object and Shred converts it
    // for us.
    content: { key: "c9KfjaIirRlg9YKpCck97Q-1321321628" },
    on: {
      // This time, we want a `201`, which means something (the session) was
      // created by the request. Again, we're freed from having to check the
      // response status.
      201: function(response) {
        assert.ok(response.content.data);
        // We'll save the session for future reference
        resources.session = response.content.data;
        console.log("√ Created a session.");
      },
      response: function(response) {
        console.log("We got something besides a 201 response!")
      }
    }
  });  
};

// We'll call it using `setTimeout` to make sure our `resources` and `schema`
// variables are initialized properly in the return from the earlier `GET`.
// Normally, you'd call this in its event handler.
setTimeout(createSession,1000);

// # Error Handling

// Let's see how Shred error handling works. We'll attempt to create channel
// using the <a class="logo" href="/">spire<span class="grey">.</span><span
// class="blue">io</span></a> message service. However, we'll "forget" to include
// an authorization header. This should give us back a `401: Unauthorized`.

// Now, we could simply handle this via the `response` event. We could also
// handle it via the `401` event. But let's use the `error` event instead, just
// for kicks.

var createChannel = function() {
  surf.post({
    url: resources.session.resources.channels.url,
    // Normally, we'd pass in a authorization header, too.
    headers: {
      accept: schema.channel.mediaType,
      content_type: schema.channel.mediaType
    },
    // We'll try to create a channel named "foo".
    content: { name: "foo" },
    on: {
      // The `error` event will fire on any response status above 400.
      error: function(response) {
        assert.equal(response.status,401);
        console.log("√ Handled channel create error.");
      },
      response: function(response) {
        console.log("We got something besides an error response!")
      }
    }
  });  
};

// Again, you'd normally call this function in an event handler.
setTimeout(createChannel,2000);

// You can also handle redirects explicitly using the `redirect` event.
// (Normally, Shred handles them for you.)

// # Other Resources
//
// - **Code.** Check out our [GitHub
//   repository](https://github.com/spire-io/shred). Don't hesitate to send us
//   pull requests!
// - **Bugs.** Please file any [bugs or feature
//   requests](https://github.com/spire-io/shred/issues)!
