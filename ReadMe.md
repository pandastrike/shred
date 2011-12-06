## Introduction

Shred is an HTTP client library for node.js that makes writing HTTP clients fun and easy.

    var Shred = require("shred");
		var surf = new Shred;
  
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

See [the wiki](https://github.com/spire-io/shred/wiki) for more examples.

## Installation

Just `npm install shred` and you're good to go.

## Feedback

Feedback is highly encouraged in the form of [tickets][tickets] or pull requests. Thank you!

## Code

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
[campbell]: mailto:jcampbell@spire.io

