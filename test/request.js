var Surf = require("surf");

var surfer = new Surf();
var request = surfer.get({ url: "http://rocket.ly/" });
console.log(request);