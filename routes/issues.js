var express = require('express');
var router = express.Router();
var Request = require('../lib/request');
var Eventinator = require('../lib/eventinator');

var config = CONFIG;

router.post('/:owner/:repo/update/:issue', function(req, res, next) {
  var issueNumber = req.params.issue;
  var issueTitle = req.body.issueTitle;
  var repoName = req.params.repo;
  var owner = req.params.owner;
  var labelsToUpdate = [req.body.newLabel];

  if (req.body.blocked == 'true') {
    labelsToUpdate.push('blocked');
  }

  var body = {
    labels: labelsToUpdate
  };

  var request = new Request(
    '/repos/' + owner + '/' + repoName + '/issues/' + issueNumber,
    'PATCH',
    req.signedCookies.accessToken,
    body
  );

  request.do(function(error, response, body) {
    if (error) {
      res.status(500).send(JSON.stringify({ error: 'There was an error updating the issue' }));
    }

    if (response.statusCode == 200) {
      res.status(200).send(JSON.stringify({ message: 'Issue updated' }));

      var eventData = {
        issue: {
          num: issueNumber,
          title: issueTitle,
          old_state: req.body.oldLabel,
          new_state:  req.body.newLabel
        },
        user: req.cookies.githubUser
      };

      if (process.env.NODE_ENV == 'production') {
        console.log('Sending ' + eventData + ' to Eventinator');
        _sendToEventinator(eventData);
      }
    } else {
      res.status(response.statusCode).send(JSON.stringify({ error: 'There was an error updating the issue' }));
    }
  });
});

router.post('/:owner/:repo/close', function(req, res, next) {
  var repoName = req.params.repo;
  var owner = req.params.owner;
  var issueNumbers = req.body.issueNumbers;
  var urls = [];
  var results = [];

  for(var i = 0; i < issueNumbers.length; i++) {
    urls.push('/repos/' + owner + '/' + repoName + '/issues/' + issueNumbers[i]);
  }

  var syncCalls = function () {
    var url = urls.pop();
    var request = new Request(
      url,
      'PATCH',
      req.signedCookies.accessToken,
      { state: 'closed' }
    );

    request.do(function(error, response, body) {
      if (response.statusCode == 200) {
        results.push(response);
      }
    });

    if(urls.length) {
      syncCalls(urls);
    } else {
      if (results.length == urls.length) {
        res.status(200).send(JSON.stringify({ message: 'Issues closed' }));
        _removeDoneCards();
      } else {
        res.status(500).send(JSON.stringify({ error: 'Failed to close some issues' }));
      }
    }
  }

  syncCalls();
});

/**
 * Send issue changes to Eventinator.
 * @param details
 */
function _sendToEventinator(details) {
  var eventinator = new Eventinator('change_issue', details);
  eventinator.record(function(error, response, body) {
    if (error) {
      console.log(error);
    }

    if (response.statusCode == 200) {
      console.log('Event sent to Eventinator');
    } else {
      console.log('Unexpected HTTP code from Eventinator: ' + response.statusCode);
    }
  });
}


function _removeDoneCards() {
  var pusher = PUSHER;
  pusher.trigger('server-updates', 'remove-done-cards', {});
}

module.exports = router;
