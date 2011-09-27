var _ = require("underscore");

var Content = function(options) {
  if (options.body) this.body = options.body;
  if (options.data) this.data = options.data;
  this.type = options.type||"text/plain";
};

Content.prototype = {
  toString: function() { return this.body; }
};

Object.defineProperties(Content.prototype,{
  data: {
    get: function() {
      if (this._body) {
        return this.processor.parser(this._body);
      } else {
        return this._data;
      }
    },
    set: function(data) {
      if (this._body) errors.setDataWithBody(this);
      this._data = data;
      return this;
    },
    enumerable: true
  },
  body: {
    get: function() {
      if (this._data) {
        return this.processor.stringify(this._data);
      } else {
        return this._body;
      }
    },
    set: function(body) {
      if (this._data) errors.setBodyWithData(this);
      this._body = body;
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
  },
  length: {
    get: function() { return this.body.length; }
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
  ["application/json; charset=utf-8","application/json","json"],
  {
    parser: function(string) {
      return JSON.parse(string);
    },
    stringify: function(data) {
      return JSON.stringify(data); }});

module.exports = Content;