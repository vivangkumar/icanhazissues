var express = require('express');
var router = express.Router();
var Request = require('../lib/request');

var config = require('../config.json');

router.post('/:repo/update/:issue', function(req, res, next) {
  var issueNumber = req.params.issue
    , repoName = req.params.repo;
  var body = {
    'labels': [req.body.new_label]
  };
  var request = new Request(
    '/repos/' + config.githubUser + '/' + repoName + '/issues/' + issueNumber,
    'PATCH',
    {'Authorization': 'token ' + req.signedCookies.accessToken},
    body
  );

  request.do(function(error, response, body) {
    if (error) {
      res.status(500).send(JSON.stringify({'error': error}))
    }

    if (response.statusCode == 200) {
      res.status(200).send(JSON.stringify({'message': 'Issue updated'}));
    } else {
      res.status(response.statusCode).send(body);
    }
  });
});

module.exports = router;
