var Surf = (function () {var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}
var __require = require;

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require.resolve = (function () {
    var core = {
        'assert': true,
        'events': true,
        'fs': true,
        'path': true,
        'vm': true
    };
    
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = Object_keys(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = function (fn) {
    setTimeout(fn, 0);
};

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.modules["path"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "path";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["path"]._cached = module.exports;
    
    (function () {
        function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};
;
    }).call(module.exports);
    
    __require.modules["path"]._cached = module.exports;
    return module.exports;
};

require.modules["/surf.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/";
    var __filename = "/surf.js";
    
    var require = function (file) {
        return __require(file, "/");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/");
    };
    
    require.modules = __require.modules;
    __require.modules["/surf.js"]._cached = module.exports;
    
    (function () {
        var _ = require("underscore")
  , Ax = require("ax")
;

var Modules = {
  Request: require("./surf/request"),
  Response: require("./surf/response")
}

var Surf = function(options) {
  options = (options||{});
  this.defaults = options.defaults||{};
  this.log = options.logger||(new Ax({ level: "info" }));
};

_.extend(Surf, Modules);

var Methods = {
  request: function(options) {
    return new Surf.Request(this, _.defaults(options,this.defaults));
  }
};

"GET PUT POST DELETE".split(" ").forEach(function(method) {
  Methods[method] = Methods[method.toLowerCase(method)] = function(options) {
    options.method = method;
    return this.request(options);
  };
});

_.extend(Surf.prototype, Methods);

module.exports = Surf;
;
    }).call(module.exports);
    
    __require.modules["/surf.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/underscore/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/underscore";
    var __filename = "/node_modules/underscore/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/underscore");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/underscore");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/underscore/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"name":"underscore","description":"JavaScript's functional programming helper library.","homepage":"http://documentcloud.github.com/underscore/","keywords":["util","functional","server","client","browser"],"author":"Jeremy Ashkenas <jeremy@documentcloud.org>","contributors":[],"dependencies":[],"repository":{"type":"git","url":"git://github.com/documentcloud/underscore.git"},"main":"underscore.js","version":"1.1.7"};
    }).call(module.exports);
    
    __require.modules["/node_modules/underscore/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/underscore/underscore.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/underscore";
    var __filename = "/node_modules/underscore/underscore.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/underscore");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/underscore");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/underscore/underscore.js"]._cached = module.exports;
    
    (function () {
        //     Underscore.js 1.1.7
//     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **CommonJS**, with backwards-compatibility
  // for the old `require()` API. If we're not in CommonJS, add `_` to the
  // global object.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _;
    _._ = _;
  } else {
    // Exported as a string, for Closure Compiler "advanced" mode.
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.1.7';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = memo !== void 0;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError("Reduce of empty array with no initial value");
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return memo !== void 0 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = (_.isArray(obj) ? obj.slice() : _.toArray(obj)).reverse();
    return _.reduce(reversed, iterator, memo, context);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator = iterator || _.identity;
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result |= iterator.call(context, value, index, list)) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    any(obj, function(value) {
      if (found = value === target) return true;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (method.call ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion produced by an iterator
  _.groupBy = function(obj, iterator) {
    var result = {};
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return slice.call(iterable);
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Get the last element of an array.
  _.last = function(array) {
    return array[array.length - 1];
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(_.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted) {
    return _.reduce(array, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) memo[memo.length] = el;
      return memo;
    }, []);
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and another.
  // Only the elements present in just the first array will remain.
  _.difference = function(array, other) {
    return _.filter(array, function(value){ return !_.include(other, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  };


  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function(func, obj) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(obj, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Internal function used to implement `_.throttle` and `_.debounce`.
  var limit = function(func, wait, debounce) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
        timeout = null;
        func.apply(context, args);
      };
      if (debounce) clearTimeout(timeout);
      if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    return limit(func, wait, false);
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    return limit(func, wait, true);
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = slice.call(arguments);
    return function() {
      var args = slice.call(arguments);
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };


  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (source[prop] !== void 0) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    // Check object identity.
    if (a === b) return true;
    // Different types?
    var atype = typeof(a), btype = typeof(b);
    if (atype != btype) return false;
    // Basic equality test (watch out for coercions).
    if (a == b) return true;
    // One is falsy and the other truthy.
    if ((!a && b) || (a && !b)) return false;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // One of them implements an isEqual()?
    if (a.isEqual) return a.isEqual(b);
    if (b.isEqual) return b.isEqual(a);
    // Check dates' integer values.
    if (_.isDate(a) && _.isDate(b)) return a.getTime() === b.getTime();
    // Both are NaN?
    if (_.isNaN(a) && _.isNaN(b)) return false;
    // Compare regular expressions.
    if (_.isRegExp(a) && _.isRegExp(b))
      return a.source     === b.source &&
             a.global     === b.global &&
             a.ignoreCase === b.ignoreCase &&
             a.multiline  === b.multiline;
    // If a is not an object by this point, we can't handle it.
    if (atype !== 'object') return false;
    // Check for different array lengths before comparing contents.
    if (a.length && (a.length !== b.length)) return false;
    // Nothing else worked, deep compare the contents.
    var aKeys = _.keys(a), bKeys = _.keys(b);
    // Different object sizes?
    if (aKeys.length != bKeys.length) return false;
    // Recursive comparison of contents.
    for (var key in a) if (!(key in b) || !_.isEqual(a[key], b[key])) return false;
    return true;
  };

  // Is a given array or object empty?
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
  };

  // Is a given value a function?
  _.isFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
  };

  // Is the given value `NaN`? `NaN` happens to be the only value in JavaScript
  // that does not equal itself.
  _.isNaN = function(obj) {
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false;
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + "__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', tmpl);
    return data ? func(data) : func;
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      method.apply(this._wrapped, arguments);
      return result(this._wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

})();
;
    }).call(module.exports);
    
    __require.modules["/node_modules/underscore/underscore.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/ax/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/ax";
    var __filename = "/node_modules/ax/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/ax");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/ax");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/ax/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"name":"ax","version":"0.0.2","description":"A simple logger","keywords":["log","logger"],"licenses":[{"type":"MIT","url":"https://github.com/spire-io/ax/blob/master/ReadMe.md"}],"homepage":"https://github.com/spire-io/ax","bugs":{"web":"https://github.com/spire-io/ax/issues"},"author":{"name":"Dan Yoder","email":"dyoder@spire.io"},"maintainers":[{"name":"Dan Yoder","email":"dyoder@spire.io"},{"name":"Jason Campbell","email":"dyoder@spire.io"}],"contributers":[{"name":"Dan Yoder","email":"dyoder@spire.io"},{"name":"Jason Campbell","email":"dyoder@spire.io"}],"main":"./lib/ax.js","repository":{"type":"git","url":"git://github.com/spire-io/ax.git"},"files":["examples","lib"],"directories":{"lib":"./lib","examples":"./examples"},"dependencies":{"colors":"0.5.0","underscore":"1.2.0"},"devDependencies":{"docco":"0.3.0","vows":"0.5.11"},"engine":"node >= 0.4.10"};
    }).call(module.exports);
    
    __require.modules["/node_modules/ax/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/ax/lib/ax.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/ax/lib";
    var __filename = "/node_modules/ax/lib/ax.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/ax/lib");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/ax/lib");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/ax/lib/ax.js"]._cached = module.exports;
    
    (function () {
        var inspect = require("util").inspect
  , fs = require("fs")
  , colors = require('colors')
  , _ = require('underscore')
;


// this is a quick-and-dirty logger. there are other nicer loggers out there
// but the ones i found were also somewhat involved. this one has a Ruby
// logger type interface and color codes the console output
//
// we can easily replace this, provide the info, debug, etc. methods are the
// same. or, we can change Haiku to use a more standard node.js interface

var Logger = function(options) {
  var logger = this;

  // this.level = options.level;
  // this.colors = options.colors || this.colors;

  // Default options
  logger.options = _.defaults(options, {
      level: 'info'
    , colors: {
        info: 'green'
      , warn: 'yellow'
      , debug: 'cyan'
      , error: 'red'
      }
    , prefix: ''
  });

  // Allows a prefix to be added to the message.
  //
  //    var logger = new Ax({ module: 'Haiku' })
  //    logger.warn('this is going to be awesome!');
  //    //=> Haiku: this is going to be awesome!
  //
  if (logger.options.module){
    logger.options.prefix = logger.options.module + ': ';
  }

  // Write to stderr or a file
  if (logger.options.file){
    logger.stream = fs.createWriteStream(logger.options.file);
  } else {
    logger.stream = process.stderr;
  }

  switch(logger.options.level){
    case 'debug':
      _.each(['debug', 'info', 'warn'], function(level){
        logger[level] = Logger.writer(level);
      });
    case 'info':
      _.each(['info', 'warn'], function(level){
        logger[level] = Logger.writer(level);
      });
    case 'warn':
      logger.warn = Logger.writer('warn');
  }
}

// Used to define logger methods
Logger.writer = function(level){
  return function(message){
    var logger = this;

    logger.stream.write(logger.format(level, message) + '\n');
  };
}


Logger.prototype = {
  info: function(){},
  debug: function(){},
  warn: function(){},
  error: Logger.writer('error'),
  format: function(level, message){
    if (! message) return '';

    var logger = this
      , prefix = logger.options.prefix
      , color = logger.options.colors[level]
    ;

    // TODO: maybe this should handle

    return (prefix + message)[color];
  }
};

module.exports = Logger;;
    }).call(module.exports);
    
    __require.modules["/node_modules/ax/lib/ax.js"]._cached = module.exports;
    return module.exports;
};

require.modules["util"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "util";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["util"]._cached = module.exports;
    
    (function () {
        // todo
;
    }).call(module.exports);
    
    __require.modules["util"]._cached = module.exports;
    return module.exports;
};

require.modules["fs"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "fs";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["fs"]._cached = module.exports;
    
    (function () {
        // nothing to see here... no file methods for the browser
;
    }).call(module.exports);
    
    __require.modules["fs"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/ax/node_modules/colors/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/ax/node_modules/colors";
    var __filename = "/node_modules/ax/node_modules/colors/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/ax/node_modules/colors");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/ax/node_modules/colors");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/ax/node_modules/colors/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"name":"colors","description":"get colors in your node.js console like what","version":"0.5.0","author":"Marak Squires","repository":{"type":"git","url":"http://github.com/Marak/colors.js.git"},"engine":["node >=0.1.90"],"main":"colors"};
    }).call(module.exports);
    
    __require.modules["/node_modules/ax/node_modules/colors/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/ax/node_modules/colors/colors.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/ax/node_modules/colors";
    var __filename = "/node_modules/ax/node_modules/colors/colors.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/ax/node_modules/colors");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/ax/node_modules/colors");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/ax/node_modules/colors/colors.js"]._cached = module.exports;
    
    (function () {
        /*
colors.js

Copyright (c) 2010 Alexis Sellier (cloudhead) , Marak Squires

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

// prototypes the string object to have additional method calls that add terminal colors
var isHeadless = (typeof module !== 'undefined');
['bold', 'underline', 'italic', 'inverse', 'grey', 'yellow', 'red', 'green', 'blue', 'white', 'cyan', 'magenta'].forEach(function (style) {

  // __defineGetter__ at the least works in more browsers
  // http://robertnyman.com/javascript/javascript-getters-setters.html
  // Object.defineProperty only works in Chrome
  String.prototype.__defineGetter__(style, function () {
    return isHeadless ?
             stylize(this, style) : // for those running in node (headless environments)
             this.replace(/( )/, '$1'); // and for those running in browsers:
             // re: ^ you'd think 'return this' works (but doesn't) so replace coerces the string to be a real string
  });
});

// prototypes string with method "rainbow"
// rainbow will apply a the color spectrum to a string, changing colors every letter
String.prototype.__defineGetter__('rainbow', function () {
  if (!isHeadless) {
    return this.replace(/( )/, '$1');
  }
  var rainbowcolors = ['red','yellow','green','blue','magenta']; //RoY G BiV
  var exploded = this.split("");
  var i=0;
  exploded = exploded.map(function(letter) {
    if (letter==" ") {
      return letter;
    }
    else {
      return stylize(letter,rainbowcolors[i++ % rainbowcolors.length]);
    }
  });
  return exploded.join("");
});

function stylize(str, style) {
  var styles = {
  //styles
  'bold'      : [1,  22],
  'italic'    : [3,  23],
  'underline' : [4,  24],
  'inverse'   : [7,  27],
  //grayscale
  'white'     : [37, 39],
  'grey'      : [90, 39],
  'black'     : [90, 39],
  //colors
  'blue'      : [34, 39],
  'cyan'      : [36, 39],
  'green'     : [32, 39],
  'magenta'   : [35, 39],
  'red'       : [31, 39],
  'yellow'    : [33, 39]
  };
  return '\033[' + styles[style][0] + 'm' + str +
         '\033[' + styles[style][1] + 'm';
};

// don't summon zalgo
String.prototype.__defineGetter__('zalgo', function () {
  return zalgo(this);
});

// please no
function zalgo(text, options) {
  var soul = {
    "up" : [
      '̍','̎','̄','̅',
      '̿','̑','̆','̐',
      '͒','͗','͑','̇',
      '̈','̊','͂','̓',
      '̈','͊','͋','͌',
      '̃','̂','̌','͐',
      '̀','́','̋','̏',
      '̒','̓','̔','̽',
      '̉','ͣ','ͤ','ͥ',
      'ͦ','ͧ','ͨ','ͩ',
      'ͪ','ͫ','ͬ','ͭ',
      'ͮ','ͯ','̾','͛',
      '͆','̚'
      ],
    "down" : [
      '̖','̗','̘','̙',
      '̜','̝','̞','̟',
      '̠','̤','̥','̦',
      '̩','̪','̫','̬',
      '̭','̮','̯','̰',
      '̱','̲','̳','̹',
      '̺','̻','̼','ͅ',
      '͇','͈','͉','͍',
      '͎','͓','͔','͕',
      '͖','͙','͚','̣'
      ],
    "mid" : [
      '̕','̛','̀','́',
      '͘','̡','̢','̧',
      '̨','̴','̵','̶',
      '͜','͝','͞',
      '͟','͠','͢','̸',
      '̷','͡',' ҉'
      ]
  },
  all = [].concat(soul.up, soul.down, soul.mid),
  zalgo = {};

  function randomNumber(range) {
    r = Math.floor(Math.random()*range);
    return r;
  };

  function is_char(character) {
    var bool = false;
    all.filter(function(i){
     bool = (i == character);
    });
    return bool;
  }

  function heComes(text, options){
      result = '';
      options = options || {};
      options["up"] = options["up"] || true;
      options["mid"] = options["mid"] || true;
      options["down"] = options["down"] || true;
      options["size"] = options["size"] || "maxi";
      var counts;
      text = text.split('');
       for(var l in text){
         if(is_char(l)) { continue; }
         result = result + text[l];

        counts = {"up" : 0, "down" : 0, "mid" : 0};

        switch(options.size) {
          case 'mini':
            counts.up = randomNumber(8);
            counts.min= randomNumber(2);
            counts.down = randomNumber(8);
          break;
          case 'maxi':
            counts.up = randomNumber(16) + 3;
            counts.min = randomNumber(4) + 1;
            counts.down = randomNumber(64) + 3;
          break;
          default:
            counts.up = randomNumber(8) + 1;
            counts.mid = randomNumber(6) / 2;
            counts.down= randomNumber(8) + 1;
          break;
        }

        var arr = ["up", "mid", "down"];
        for(var d in arr){
          var index = arr[d];
          for (var i = 0 ; i <= counts[index]; i++)
          {
            if(options[index]) {
                result = result + soul[index][randomNumber(soul[index].length)];
              }
            }
          }
        }
      return result;
  };
  return heComes(text);
}
;
    }).call(module.exports);
    
    __require.modules["/node_modules/ax/node_modules/colors/colors.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/surf/request.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/surf";
    var __filename = "/surf/request.js";
    
    var require = function (file) {
        return __require(file, "/surf");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/surf");
    };
    
    require.modules = __require.modules;
    __require.modules["/surf/request.js"]._cached = module.exports;
    
    (function () {
        var HTTP = require("http")
  , HTTPS = require("https")
  , URL = require("url")
  , QueryString = require("querystring")
  , EventEmitter = require('events').EventEmitter
  , sprintf = require("sprintf").sprintf
  , _ = require("underscore")
  , Response = require("./response")
  , HeaderMixins = require("./mixins/headers")
  , Content = require("./content")
;

var Request = function(client, options) {


  this.client = client;
  this.log = client.log;

  Private.processOptions(this,options||{});
  Private.createRequest(this);

  // call our superclass constructor ...
  EventEmitter.call(this);
};

_.extend(Request.prototype, EventEmitter.prototype);

Object.defineProperties(Request.prototype, {

  url: {
    get: function() {
      if (!this.scheme) { return null; }
      return sprintf("%s://%s:%s%s",
          this.scheme, this.host, this.port,
          (this.proxy ? "/" : this.path) +
          (this.query ? ("?" + this.query) : ""));
    },
    set: function(_url) {
      _url = URL.parse(_url);
      this.scheme = _url.protocol.slice(0,-1);
      this.host = _url.hostname;
      this.port = _url.port;
      this.path = _url.pathname;
      this.query = _url.query;
      return this;
    },
    enumerable: true
  },

  headers: {
    get: function() { return this.getHeaders(); },
    enumerable: true
  },

  // port -
  // defaults based on the scheme
  port: {
    get: function() {
      if (!this._port) {
        switch(this.scheme) {
          case "https": return this._port = 443;
          case "http":
          default: return this._port = 80;
        }
      }
      return this._port;
    },
    set: function(value) { this._port = value; return this; },
    enumerable: true
  },
  // method
  // default to GET
  method: {
    get: function() {
      return this._method = (this._method||"GET");
    },
    set: function(value) {
      this._method = value; return this;
    },
    enumerable: true
  },

  // query
  // can be set with an object, which is converted to a query string
  // get returns the query string
  query: {
    get: function() {
       return this._query = (this._query||"");
    },
    set: function(value) {
      this._query = (value instanceof String) ? value :
        QueryString.stringify(value);
      return this;
    },
    enumerable: true
  },

  // parameters
  // get only - returns the object representation of the query
  parameters: {
    get: function() { return QueryString.parse(this._query); },
    enumerable: true
  },

  // body
  // set will automatically construct a Content object
  // get returns the Content object
  body: {
    get: function() { return this._body; },
    set: function(value) {
      this._body = new Content({
        data: value,
        type: this.getHeader("Content-Type")
      });
      this.setHeader("Content-Type",this.content.type);
      this.setHeader("Content-Length",this.content.length);
      return this;
    },
    enumerable: true
  },

  // timeout
  // set will take either milliseconds or an object with
  // temporal attributes (hours, minutes, seconds) and
  // convert it into milliseconds
  timeout: {
    get: function() { return this._timeout; }, // in milliseconds
    set: function(timeout) {
      var request = this
        , milliseconds = 0;
      ;
      if (!timeout) return this;
      if (typeof options=="number") { milliseconds = options; }
      else {
        milliseconds = (options.milliseconds||0) +
          (1000 * ((options.seconds||0) +
              (60 * ((options.minutes||0) +
                (60 * (options.hours||0))))));
      }
      this._timeout = milliseconds;
      return this;
    },
    enumerable: true
  }
});

// alias proprety: content to body
Object.defineProperty(Request.prototype,"content",
    Object.getOwnPropertyDescriptor(Request.prototype, "body"));

// Methods
_.extend(Request.prototype,{
  inspect: function() {
    var request = this;
    var headers = _(request.headers).reduce(function(array,value,key){
      array.push("\t" + key + ": " + value); return array;
    },[]).join("\n");
    var summary = ["<Surf Request> ", request.method.toUpperCase(),
        request.url].join(" ")
    return [ summary, "- Headers:", headers].join("\n");
  },
  send: function() {

  }
});

var Private = {
  processOptions: function(request,options) {

    request.log.debug("Processing request options ..");

    console.log('blah', this);

    // Make sure we were give a URL or a host
    if (!options.url && !options.host) {
      request.emit("Error",
          new Error("No url or url options (host, port, etc.)"));
    }

    if (options.url) {
      if (options.proxy) {
        request.url = options.proxy;
        request.path = options.url;
      } else {
        request.url = options.url;
      }
    }

    request.query = options.query||options.parameters;
    request.method = options.method;
    request.setHeader("User-Agent","Surf for Node.js, Version 0.1.0");
    request.setHeaders(options.headers);
    if (options.body||options.content) {
      request.content = options.body||options.content;
    }
    request.timeout = options.timeout;

    if (options.on) {
      _(options.on).each(function(value,key) {
        request.on(key,value);
      });
    }
  },
  createRequest: function(request) {
    var timeout
      , surfer = request.client
    ;

    request.log.debug("Creating request ..");
    request.log.debug(request);

    var http = request.scheme == "http" ? HTTP : HTTPS;

    request._raw = http.request(Object.create(request), function(response) {

      request.log.debug("Received response ..");

      // okay, we haven't timed out and we have a response
      clearTimeout(timeout);

      response = new Response(response, request, function(response) {
        if (response.isRedirect) {
          // just repeat the request with the new url
          request.log.debug("Redirecting to "
              + response.getHeader("Location"));
          request.url = response.getHeader("Location");
          Private.createRequest(request);
        } else if (response.isError) {
          request.emit("error", response );
        } else { // no error, no redirect
          request.emit("response",response);
        }
        request.emit(response.status,response);
      });
    });

    request._raw.on("error", function(error) {
      request.log.error("Request failed: " + error.message);
    });

    if (request.content) {
      request.log.debug("Streaming body: '" +
          request.content.body.slice(0,59) + "' ... ");
      request._raw.write(request.content.body);
    }

    if (request.timeout) {
      timeout = setTimeout(function() {
        request.log.debug("Timeout fired, aborting request ...");
        request._raw.abort();
        request.emit("timeout", request);
      },request.timeout);
    }

    // this will start the request
    request.log.debug("Sending request ...");
    request._raw.end();
  }
};

HeaderMixins.Getters.mixWith(Request);
HeaderMixins.Setters.mixWith(Request);

module.exports = Request;
;
    }).call(module.exports);
    
    __require.modules["/surf/request.js"]._cached = module.exports;
    return module.exports;
};

require.modules["http"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "http";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["http"]._cached = module.exports;
    
    (function () {
        // todo
;
    }).call(module.exports);
    
    __require.modules["http"]._cached = module.exports;
    return module.exports;
};

require.modules["https"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "https";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["https"]._cached = module.exports;
    
    (function () {
        // todo
;
    }).call(module.exports);
    
    __require.modules["https"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/url/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/url";
    var __filename = "/node_modules/url/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/url");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/url");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/url/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"author":"Joyent (http://www.joyent.com)","name":"url","description":"Node.JS url module","keywords":["ender","url"],"version":"0.4.9","homepage":"http://nodejs.org/docs/v0.4.9/api/url.html","repository":{"type":"git","url":"git://github.com/coolaj86/nodejs-libs-4-browser.git"},"main":"./url.js","directories":{"lib":"."},"engines":{"node":">= 0.2.0","ender":">= 0.5.0"},"dependencies":{"querystring":">= 0.0.0"},"devDependencies":{}};
    }).call(module.exports);
    
    __require.modules["/node_modules/url/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["url"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "url";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["url"]._cached = module.exports;
    
    (function () {
        // todo
;
    }).call(module.exports);
    
    __require.modules["url"]._cached = module.exports;
    return module.exports;
};

require.modules["querystring"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "querystring";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["querystring"]._cached = module.exports;
    
    (function () {
        var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.toString.call(xs) === '[object Array]'
    }
;

/*!
 * querystring
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.3.1';

/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Cache non-integer test regexp.
 */

var notint = /[^0-9]/;

/**
 * Parse the given query `str`, returning an object.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};

  function promote(parent, key) {
    if (parent[key].length == 0) return parent[key] = {};
    var t = {};
    for (var i in parent[key]) t[i] = parent[key][i];
    parent[key] = t;
    return t;
  }

  return String(str)
    .split('&')
    .reduce(function(ret, pair){
      try{ 
        pair = decodeURIComponent(pair.replace(/\+/g, ' '));
      } catch(e) {
        // ignore
      }

      var eql = pair.indexOf('=')
        , brace = lastBraceInKey(pair)
        , key = pair.substr(0, brace || eql)
        , val = pair.substr(brace || eql, pair.length)
        , val = val.substr(val.indexOf('=') + 1, val.length)
        , parent = ret;

      // ?foo
      if ('' == key) key = pair, val = '';

      // nested
      if (~key.indexOf(']')) {
        var parts = key.split('[')
          , len = parts.length
          , last = len - 1;

        function parse(parts, parent, key) {
          var part = parts.shift();

          // end
          if (!part) {
            if (isArray(parent[key])) {
              parent[key].push(val);
            } else if ('object' == typeof parent[key]) {
              parent[key] = val;
            } else if ('undefined' == typeof parent[key]) {
              parent[key] = val;
            } else {
              parent[key] = [parent[key], val];
            }
          // array
          } else {
            obj = parent[key] = parent[key] || [];
            if (']' == part) {
              if (isArray(obj)) {
                if ('' != val) obj.push(val);
              } else if ('object' == typeof obj) {
                obj[Object.keys(obj).length] = val;
              } else {
                obj = parent[key] = [parent[key], val];
              }
            // prop
            } else if (~part.indexOf(']')) {
              part = part.substr(0, part.length - 1);
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            // key
            } else {
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            }
          }
        }

        parse(parts, parent, 'base');
      // optimize
      } else {
        if (notint.test(key) && isArray(parent.base)) {
          var t = {};
          for(var k in parent.base) t[k] = parent.base[k];
          parent.base = t;
        }
        set(parent.base, key, val);
      }

      return ret;
    }, {base: {}}).base;
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix;
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[]'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = Object.keys(obj)
    , key;
  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    ret.push(stringify(obj[key], prefix
      ? prefix + '[' + encodeURIComponent(key) + ']'
      : encodeURIComponent(key)));
  }
  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}
;
    }).call(module.exports);
    
    __require.modules["querystring"]._cached = module.exports;
    return module.exports;
};

require.modules["events"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "events";
    
    var require = function (file) {
        return __require(file, ".");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, ".");
    };
    
    require.modules = __require.modules;
    __require.modules["events"]._cached = module.exports;
    
    (function () {
        if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.toString.call(xs) === '[object Array]'
    }
;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};
;
    }).call(module.exports);
    
    __require.modules["events"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/sprintf/package.json"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/sprintf";
    var __filename = "/node_modules/sprintf/package.json";
    
    var require = function (file) {
        return __require(file, "/node_modules/sprintf");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/sprintf");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/sprintf/package.json"]._cached = module.exports;
    
    (function () {
        module.exports = {"name":"sprintf","version":"0.1.1","engines":{"node":">=0.2.4"},"author":"Moritz Peters","directories":{"lib":"./lib"},"description":"Sprintf() for node.js","main":"./lib/sprintf"};
    }).call(module.exports);
    
    __require.modules["/node_modules/sprintf/package.json"]._cached = module.exports;
    return module.exports;
};

require.modules["/node_modules/sprintf/lib/sprintf.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/node_modules/sprintf/lib";
    var __filename = "/node_modules/sprintf/lib/sprintf.js";
    
    var require = function (file) {
        return __require(file, "/node_modules/sprintf/lib");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/node_modules/sprintf/lib");
    };
    
    require.modules = __require.modules;
    __require.modules["/node_modules/sprintf/lib/sprintf.js"]._cached = module.exports;
    
    (function () {
        /**
sprintf() for JavaScript 0.7-beta1
http://www.diveintojavascript.com/projects/javascript-sprintf

Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of sprintf() for JavaScript nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


Changelog:
2010.11.07 - 0.7-beta1-node
  - converted it to a node.js compatible module

2010.09.06 - 0.7-beta1
  - features: vsprintf, support for named placeholders
  - enhancements: format cache, reduced global namespace pollution

2010.05.22 - 0.6:
 - reverted to 0.4 and fixed the bug regarding the sign of the number 0
 Note:
 Thanks to Raphael Pigulla <raph (at] n3rd [dot) org> (http://www.n3rd.org/)
 who warned me about a bug in 0.5, I discovered that the last update was
 a regress. I appologize for that.

2010.05.09 - 0.5:
 - bug fix: 0 is now preceeded with a + sign
 - bug fix: the sign was not at the right position on padded results (Kamal Abdali)
 - switched from GPL to BSD license

2007.10.21 - 0.4:
 - unit test and patch (David Baird)

2007.09.17 - 0.3:
 - bug fix: no longer throws exception on empty paramenters (Hans Pufal)

2007.09.11 - 0.2:
 - feature: added argument swapping

2007.04.03 - 0.1:
 - initial release
**/

var sprintf = (function() {
	function get_type(variable) {
		return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	}
	function str_repeat(input, multiplier) {
		for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
		return output.join('');
	}

	var str_format = function() {
		if (!str_format.cache.hasOwnProperty(arguments[0])) {
			str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
		}
		return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
	};

	str_format.format = function(parse_tree, argv) {
		var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
		for (i = 0; i < tree_length; i++) {
			node_type = get_type(parse_tree[i]);
			if (node_type === 'string') {
				output.push(parse_tree[i]);
			}
			else if (node_type === 'array') {
				match = parse_tree[i]; // convenience purposes only
				if (match[2]) { // keyword argument
					arg = argv[cursor];
					for (k = 0; k < match[2].length; k++) {
						if (!arg.hasOwnProperty(match[2][k])) {
							throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
						}
						arg = arg[match[2][k]];
					}
				}
				else if (match[1]) { // positional argument (explicit)
					arg = argv[match[1]];
				}
				else { // positional argument (implicit)
					arg = argv[cursor++];
				}

				if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
					throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
				}
				switch (match[8]) {
					case 'b': arg = arg.toString(2); break;
					case 'c': arg = String.fromCharCode(arg); break;
					case 'd': arg = parseInt(arg, 10); break;
					case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
					case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
					case 'o': arg = arg.toString(8); break;
					case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
					case 'u': arg = Math.abs(arg); break;
					case 'x': arg = arg.toString(16); break;
					case 'X': arg = arg.toString(16).toUpperCase(); break;
				}
				arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
				pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
				pad_length = match[6] - String(arg).length;
				pad = match[6] ? str_repeat(pad_character, pad_length) : '';
				output.push(match[5] ? arg + pad : pad + arg);
			}
		}
		return output.join('');
	};

	str_format.cache = {};

	str_format.parse = function(fmt) {
		var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
		while (_fmt) {
			if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
				parse_tree.push(match[0]);
			}
			else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
				parse_tree.push('%');
			}
			else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
				if (match[2]) {
					arg_names |= 1;
					var field_list = [], replacement_field = match[2], field_match = [];
					if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
						field_list.push(field_match[1]);
						while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
							if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else {
								throw('[sprintf] huh?');
							}
						}
					}
					else {
						throw('[sprintf] huh?');
					}
					match[2] = field_list;
				}
				else {
					arg_names |= 2;
				}
				if (arg_names === 3) {
					throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
				}
				parse_tree.push(match);
			}
			else {
				throw('[sprintf] huh?');
			}
			_fmt = _fmt.substring(match[0].length);
		}
		return parse_tree;
	};

	return str_format;
})();

var vsprintf = function(fmt, argv) {
	argv.unshift(fmt);
	return sprintf.apply(null, argv);
};

exports.sprintf = sprintf;
exports.vsprintf = vsprintf;;
    }).call(module.exports);
    
    __require.modules["/node_modules/sprintf/lib/sprintf.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/surf/response.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/surf";
    var __filename = "/surf/response.js";
    
    var require = function (file) {
        return __require(file, "/surf");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/surf");
    };
    
    require.modules = __require.modules;
    __require.modules["/surf/response.js"]._cached = module.exports;
    
    (function () {
        var _ = require("underscore")
  , Content = require("./content")
  , HeaderMixins = require("./mixins/headers")
  
;

var Response = function(raw, request, callback) { 
  var response = this;
  this._raw = raw; 
  HeaderMixins.Setters.Methods.setHeaders.call(this,raw.headers);
  this.request = request;
  this.client = request.client;
  this.log = this.request.log;
  var body = "";
  raw.on("data", function(data) { body += data; });
  raw.on("end", function() {
    response._body = new Content({ 
      body: body,
      type: response.getHeader("Content-Type")
    });
    callback(response);
  });
};

Response.prototype = {
  inspect: function() {
    var response = this;
    var headers = _(response.headers).reduce(function(array,value,key){
      array.push("\t" + key + ": " + value); return array;
    },[]).join("\n");
    var summary = ["<Surf Response> ", response.status].join(" ")
    return [ summary, "- Headers:", headers].join("\n");
  }
};

Object.defineProperties(Response.prototype, {
  status: {
    get: function() { return this._raw.statusCode; },
    enumerable: true
  },
  body: {
    get: function() { return this._body; },
    enumerable: true
  },
  content: {
    get: function() { return this.body; }
  },
  isRedirect: {
    get: function() {
      return (this.status>299
          &&this.status<400
          &&this.getHeaders("Location"));
    },
    enumerable: true
  },
  isError: {
    get: function() {
      return (this.status>399)
    },
    enumerable: true
  }
});

HeaderMixins.Getters.mixWith(Response);
module.exports = Response;
;
    }).call(module.exports);
    
    __require.modules["/surf/response.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/surf/content.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/surf";
    var __filename = "/surf/content.js";
    
    var require = function (file) {
        return __require(file, "/surf");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/surf");
    };
    
    require.modules = __require.modules;
    __require.modules["/surf/content.js"]._cached = module.exports;
    
    (function () {
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
module.exports = Content;;
    }).call(module.exports);
    
    __require.modules["/surf/content.js"]._cached = module.exports;
    return module.exports;
};

require.modules["/surf/mixins/headers.js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "/surf/mixins";
    var __filename = "/surf/mixins/headers.js";
    
    var require = function (file) {
        return __require(file, "/surf/mixins");
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, "/surf/mixins");
    };
    
    require.modules = __require.modules;
    __require.modules["/surf/mixins/headers.js"]._cached = module.exports;
    
    (function () {
        // One of the reasons we're defining the implementation here using private
// methods is so that clients can use call or apply with one mixin without
// introducing a dependency on another (ex: Getters without Setters)

var _ = require("underscore")
;

var corsetCase = function(string) {
  return string.toLowerCase()
      .replace("_","-")
      .replace(/(^|-)(\w)/g, 
          function(s) { return s.toUpperCase(); });
};

var initializeHeaders = function(object) {
  return {};
};

var $H = function(object) {
  return object._headers||(object._headers=initializeHeaders(object));
};

var getHeader = function(object,name) {
  return $H(object)[corsetCase(name)];
};

var getHeaders = function(object,names) {
  var keys = (names && names.length>0) ? names : Object.keys($H(object));
  var hash = keys.reduce(function(hash,key) {
    hash[key] = getHeader(object,key);
    return hash;
  },{});
  Object.freeze(hash);
  return hash;
};

var setHeader = function(object,name,value) {
  $H(object)[corsetCase(name)] = value;
  return object;
};

var setHeaders = function(object,hash) {
  for( var key in hash ) { setHeader(object,key,hash[key]); };
  return this;
};

var Headers = {
  Getters: {
    Methods: {
      getHeader: function(name) { return getHeader(this,name); },
      getHeaders: function() { return getHeaders(this,_(arguments)); }
    },
    Properties: {},
    mixWith: function(exemplar) { return mixin(exemplar,this); }
  },
  Setters: {
    Methods: {
      setHeader: function(key,value) { return setHeader(this,key,value); },
      setHeaders: function(hash) { return setHeaders(this,hash); }
    },
    Properties: {},
    mixWith: function(exemplar) { return mixin(exemplar,this); }
  },
};

var mixin = function(exemplar,mixin) {
  for (var method in mixin.Methods) {
    exemplar.prototype[method] = mixin.Methods[method];
  }
  Object.defineProperties(exemplar.prototype, mixin.Properties);
  return exemplar;
};


module.exports = Headers;;
    }).call(module.exports);
    
    __require.modules["/surf/mixins/headers.js"]._cached = module.exports;
    return module.exports;
};
; return require("./surf.js")})()