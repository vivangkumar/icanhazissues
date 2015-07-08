var express = require('express');
var router = express.Router();

var config = CONFIG;
var pusher = PUSHER;

/**
 * Use pusher to broadcast changes to frontend
 */
function githubSync(owner, repo, event, data) {
  var channelName = repo + '-' +owner + '-githubsync';
  pusher.trigger(channelName, event, data);
}

/**
 * Remove some keys from the Github JSON
 * to fit Pusher's 10KB limit.
 * PS. I work at Pusher - must get more allowance :P
 */
function stripJson(json) {
  delete json['repository'];
  delete json['sender'];

  return json;
}

router.post('/', function(req, res, next) {
  var repo = req.body.repository.name;
  var owner = req.body.repository.owner.login;
  var body = stripJson(req.body);
  var event = body.action;

  githubSync(owner, repo, event, body);
  res.status(200).end();
});

module.exports = router;
