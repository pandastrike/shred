var config = require('../lib/config.js')
  , assert = require('assert')

module.exports = {

    'config always returns an object': function () {
      assert.equal('object', typeof config())
    }

  , 'config defaults': function () {
    assert.deepEquals({ 'port': 8887 }, config())
  }

}