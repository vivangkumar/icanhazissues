var request = require('request');

var GITHUBURL = 'https://api.github.com';

function Request(path, method, headers) {
  this.method = method;
  this.url = GITHUBURL + path;
  this.headers = {
    'User-Agent': 'Kanban'
  };

  if (headers) {
    for (key in headers) {
      this.headers[key] = headers[key];
    }
  }

  this.options = {
    uri: this.url,
    method: this.method,
    headers: this.headers
  };
}

Request.prototype = {
  constructor: Request,

  do: function(callback) {
    request(this.options, callback);
  }
};

module.exports = Request;
