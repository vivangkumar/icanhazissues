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

router.post('/', function(req, res, next) {
  var body = req.body;
  var repo = req.body.repository.name;
  var owner = req.body.repository.owner.login;
  var event = body.action;

  githubSync(owner, repo, event, body);
  res.status(200).end();
});

module.exports = router;
