var _ = require("underscore");

var Content = function(data,type) {
  this.type = type;
  this.data = data;
};

Content.prototype = {
  toString: function() {
    return this.text;
  }
};

Object.defineProperties(Content.prototype,{
  data: {
    get: function() {
      return this._data;
    },
    set: function(data) {
      if (typeof data == 'string') {
        this.text = data;
        this._data = this.processor.parser(data);
      } else {
        this._data = data;
        this.text = this.processor.stringify(data);
      }
      return this;
    },
    enumerable: true
  },
  processor: {
    get: function() {
      var processor = Content.processors[this.type];
      if (processor) {
        return processor;
      } else {
        // return the first processor that matches any part of the
        // content type. ex: application/vnd.foobar.baz+json will match json
        processor = _(this.type.split(/\+|\//)).detect(function(type) {
          return Content.processors[type];
        });
        return processor||{parser:identity,stringify:identity};
      }
    },
    enumerable: true
  }
});

Content.processors = {};

Content.registerProcessor = function(types,processor) {
  if (types.forEach) {
    types.forEach(function(type) {
      Content.processors[type] = processor;
    });
  } else {
    // 'types' is actually just one type
    Content.processors[types] = processor;
  }
};

var identity = function(x) { return x; }
Content.registerProcessor(
  ["text/html","text/plain","text"], 
  { parser: identity, stringify: identity });

Content.registerProcessor(
  ["application/json","json"],
  {
    parser: function(string) {
      return JSON.parse(string);
    },
    stringify: function(data) {
      return JSON.stringify(data); }});

module.exports = Content;