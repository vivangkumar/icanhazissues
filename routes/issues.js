var express = require('express');
var router = express.Router();
var Request = require('../lib/request');

var config = require('../config.json');

router.post('/:repo/update/:issue', function(req, res, next) {
  var issueNumber = req.params.issue
    , repoName = req.params.repo;
  var body = {
    'labels': [req.body.newLabel]
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
      var commentData = {
        'owner': config.githubUser,
        'repo': repoName,
        'issueNumber': issueNumber,
        'accessToken': req.signedCookies.accessToken,
        'oldLabel': req.body.oldLabel,
        'newLabel': req.body.newLabel
      };
      try {
        _postIssueComment(commentData);
      } catch (ex) {
        console.log(ex);
      }
    } else {
      res.status(response.statusCode).send(body);
    }
  });
});

/**
 * Post a comment on the issue indicating states have changed.
 * @param data
 */
function _postIssueComment(data) {
  var request = new Request(
    '/repos/' + data.owner + '/' + data.repo + '/issues/' + data.issueNumber + '/comments',
    'POST',
    {'Authorization': 'token ' + data.accessToken},
    { 'body': 'changed status from ' + data.oldLabel + ' to ' + data.newLabel }
  );

  request.do(function(error, response, body) {
    if (error) {
      throw error;
    }

    if (response.statusCode == 201) {
      console.log('Issue comment added.');
    } else {
      throw 'Error posting comment. Code: ' + response.statusCode + ' Body: '+ JSON.stringify(body);
    }
  });
}

module.exports = router;
