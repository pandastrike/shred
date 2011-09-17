var Surf = require("surf");
var surfer = new Surf();

surfer.get({
  url: "http://google.com",
  on: {
    response: function(response) {
      console.log(response.body);
    }
  }
});