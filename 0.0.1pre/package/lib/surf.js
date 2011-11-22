/*!
 * Surf
 * ~~~~~~
 * Streaming Server
 */


exports.version = '0.0.1pre';

var Server = exports.Server = require('server.js');

exports.createServer = Server.createServer;

exports.Store = require('store.js');

exports.Router = require('router.js');

exports.Api = require('api.js');





