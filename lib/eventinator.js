/**
 * Eventinator.js
 */

var request = require('request');

var config = CONFIG;

/**
 * Sends an event to Eventinator.
 * @param event
 * @param params
 */
function Eventinator(event, params) {
  this.event = event;
  this.params = params || {};
  this.body = {
    event: {
      name: this.event,
      params: this.params
    },
    api_key: config.eventinatorKey
  };

  this.options = {
    url: 'http://eventinator.io/events',
    method: 'POST',
    json: true,
    body: this.body
  };
}

Eventinator.prototype = {
  constructor: Eventinator,

  record: function(callback) {
    request(this.options, callback);
  }
};

module.exports = Eventinator;
