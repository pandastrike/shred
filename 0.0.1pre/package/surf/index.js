var http = require('http')
  , util = require('util')
  , stream = require('stream')
  , Stream = stream.Stream;

function Wave (dest, options) {
  Stream.call(this);

  console.log(arguments);

  var self = this;

  this.dest = dest;
  this.options = options;
  this.readable = true;
  this.writable = true;

  this.on('pipe', function (source) {
    self.source = source;
  })
}

util.inherits(Wave, Stream)

Wave.prototype.pipe = function (dest) {
  if (this.response) throw new Error('You cannot pipe after the response event.');
  Stream.prototype.pipe.call(this, dest);
  return dest;
};

Wave.prototype.write = function (data) {
  console.log(data);
  this.emit('data', data);
};

Wave.prototype.end = function () {
  this.emit('end');
};


//var wave = new Wave()
//
//console.dir(wave)

http.createServer(function (req, res) {
  var wave = new Wave(null, {});

  req.pipe(wave).pipe(res);

  console.dir(Object.getOwnPropertyNames(wave))
  wave.on('end', function() {
    console.log(Object.keys(wave.source))
//    res.writeHead(200, {
//      'Content-Length': req.url.length,
//      'Content-Type': 'text/html'
//    })
  })

  //wave.write(req.url)
  Object.keys(wave.source).forEach(function (key) { wave.write(key+'\n') });

}).listen(8887)
  
//req.pipe(static).pipe(res)
