var Surf = require("surf");
var surfer = new Surf();

surfer.get({
  url: "http://rocket.ly",
  on: {
    response: function(response) {
      console.log(response.body);
    }
  }
});
