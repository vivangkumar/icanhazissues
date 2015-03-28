var express = require('express');
var router = express.Router();
var Pusher = require('pusher');

var config = require('../config.json');

var pusher = new Pusher({
  appId: config.pusherAppId,
  key: config.pusherKey,
  secret: config.pusherSecret
});

router.post('/auth', function(req, res, next) {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  var auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

module.exports = router;
