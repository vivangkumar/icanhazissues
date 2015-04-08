var express = require('express');
var router = express.Router();
var Request = require('../lib/request');
var Eventinator = require('../lib/eventinator');

var config = CONFIG;

router.post('/:repo/update/:issue', function(req, res, next) {
  var issueNumber = req.params.issue
    , repoName = req.params.repo;
  var labelsToUpdate = [req.body.newLabel];

  if (req.body.blocked == 'true') {
    labelsToUpdate.push('blocked');
  }

  var body = {
    labels: labelsToUpdate
  };

  var request = new Request(
    '/repos/' + config.githubUser + '/' + repoName + '/issues/' + issueNumber,
    'PATCH',
    {Authorization: 'token ' + req.signedCookies.accessToken},
    body
  );

  request.do(function(error, response, body) {
    if (error) {
      res.status(500).send(JSON.stringify({error: 'There was an error updating the issue'}));
    }

    if (response.statusCode == 200) {
      res.status(200).send(JSON.stringify({message: 'Issue updated'}));
      var commentData = {
        owner: config.githubUser,
        repo: repoName,
        issueNumber: issueNumber,
        accessToken: req.signedCookies.accessToken,
        oldLabel: req.body.oldLabel,
        newLabel: req.body.newLabel
      };
      try {
        _postIssueComment(commentData);
      } catch (ex) {
        console.log(ex);
      }
    } else {
      res.status(response.statusCode).send(JSON.stringify({error: 'There was an error updating the issue'}));
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
    {Authorization: 'token ' + data.accessToken},
    {body: 'changed status from ' + data.oldLabel + ' to ' + data.newLabel}
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

/**
 * Send issue changes to Eventinator.
 * @param details
 */
function _sendToEventinator(details) {
  var eventDetails = {
    issue: {
      num: details.issueNumber,
      title: details.issueTitle,
      old_state: details.oldLabel,
      new_state: details.newLabel
    },
    user: details.githubUser
  };
  var eventinator = new Eventinator('change_issue', eventDetails);
  eventinator.record();
}

module.exports = router;
