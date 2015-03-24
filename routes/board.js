var express = require('express');
var router = express.Router();
var Request = require('../lib/request');
var config = require('../config.json');

router.get('/:repo', function(req, res, next) {
  var repoName = req.params.repo;
  var request = new Request(
    '/repos/'+ config.githubUser + '/'+ repoName + '/issues?state=open',
    'GET',
    {'Authorization': 'token ' + req.signedCookies.accessToken}
  );

  request.do(function(error, response, body) {
    if (error) {
      res.status(500).send(JSON.stringify({"error": error}))
    }

    if (response.statusCode == 200) {
      var parsedRepos = JSON.parse(body);
      var issueList = [];
      for(var i = 0; i < parsedRepos.length; i++) {
        var issues = {
          'title': parsedRepos[i].title,
          'url': parsedRepos[i].url,
          'assignee': parsedRepos[i].assignee,
          'label': parsedRepos[i].labels
        }
        
        issueList.push(issues);
      }
      res.render('board', {
        boardColumns: config.boardColumns,
        issues: issueList
      });
    } else {
      res.status(response.statusCode).send(body);
    }
  });
});

module.exports = router;
