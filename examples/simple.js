var Surf = require("surf")
  , Ax = require("ax")
;
var surfer = new Surf({ logger: new Ax({ level: "debug" })});

surfer.get({
  url: "http://localhost:1337/200",
  on: {
    response: function(response) {
      console.log(response.content.body);
    }
  }
});
