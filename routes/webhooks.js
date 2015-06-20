var express = require('express');
var router = express.Router();

var config = CONFIG;

function handleEvent (body) {
  var eventMap = {
    reopened: function(body) {
      console.log(body);
    }
  }

  eventMap[body.action](body);
}

router.post('/', function(req, res, next) {
  var body = req.body;
  handleEvent(body);
});

module.exports = router;
