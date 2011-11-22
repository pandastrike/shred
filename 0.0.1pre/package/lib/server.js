/*!
 * Surf
 * ~~~~~~
 * Streaming Server
 */

var config = require('config.js')
  , Store = require('store.js')
  , Router = require('router.js')

module.exports = function Server ( options ) {
  var settings = this.settings = config(options)
  this.id = settings.id || (settings.id = generateId())
  this.store = new Store(settings)
  this.router = new Router(settings)
}

function generateId () {
  return Math.abs(Math.random() * Math.random() * Date.now() | 0)
}