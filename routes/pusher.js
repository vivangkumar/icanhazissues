var express = require('express');
var router = express.Router();

var config = CONFIG;
var pusher = PUSHER;

/** Auth endpoint for private channels **/
router.post('/auth', function(req, res, next) {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  var auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

module.exports = router;
