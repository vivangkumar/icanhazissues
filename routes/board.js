var express = require('express');
var router = express.Router();

var config = require('../config.json');

router.get('/:repo', function(req, res, next) {
  res.render('board', {boardColumns: config.boardColumns});
});

module.exports = router;
