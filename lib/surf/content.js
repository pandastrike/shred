var _ = require("underscore");

var Content = function(options) {
  this.body = options.body;
  this.data = options.data;
  this.type = options.type;
};

Content.prototype = {
  //toString: function() { return this.body; }
};

Object.defineProperties(Content.prototype,{
  type: {
    get: function() {
      if (this._type) {
        return this._type;
      } else {
        if (this._data) {
          switch(typeof this._data) {
            case "string": return "text/plain";
            case "object": return "application/json";
          }
        }
      }
      return "text/plain";
    },
    set: function(value) {
      this._type = value;
      return this;
    },
    enumerable: true
  },
  data: {
    get: function() {
      if (this._body) {
        return this.processor.parser(this._body);
      } else {
        return this._data;
      }
    },
    set: function(data) {
      if (this._body&&data) Errors.setDataWithBody(this);
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
      if (this._data&&body) Errors.setBodyWithData(this);
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
        processor = _(this.type.split(";")[0]
          .split(/\+|\//)).detect(function(type) {
            return Content.processors[type];
          });
        return Content.processors[processor]||
          {parser:identity,stringify:identity};
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

var Errors = {
  setDataWithBody: function(object) {
    throw new Error("Attempt to set data attribute of a content object " +
        "when the body attributes was already set.");
  },
  setBodyWithData: function(object) {
    throw new Error("Attempt to set body attribute of a content object " +
        "when the data attributes was already set.");
  }
}
module.exports = Content;