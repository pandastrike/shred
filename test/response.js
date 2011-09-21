var Surf = require("surf");

var surfer = new Surf();
var request = surfer.get({ 
  url: "http://rocket.ly/",
  on: {
    response: function(response) {
      console.log("HELLO!");
      console.log(response);  
    },
    error: function(response) {
      //console.log("ERROR!");
      //console.log(response);  
    }
  } 
});

console.log(request);