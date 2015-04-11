/**
 * Request.js
 */

var request = require('request');

var GITHUBURL = 'https://api.github.com';

/**
 * Makes a request to the Github API.
 * @param path
 * @param method
 * @param headers
 * @param body
 */
function Request(path, method, headers, body) {
  this.method = method;
  this.url = GITHUBURL + path;
  this.headers = {
    'User-Agent': 'Kanban'
  };

  this.options = {
    uri: this.url,
    method: this.method,
    headers: this.headers
  };

  if (headers) {
    for (key in headers) {
      this.options.headers[key] = headers[key];
    }
  }

  if (method == 'POST' || method == 'PATCH') {
    this.body = body;
    this.json = true;
    this.options['body'] = this.body;
    this.options['json'] = this.json;
  }
}

Request.prototype = {
  constructor: Request,

  do: function(callback) {
    request(this.options, callback);
  }
};

module.exports = Request;
