var express = require('express');
var router = express.Router();
var Request = require('../lib/request');
var config = require('../config.json');

/**
 * Categorize issues based on column names.
 * @param issues
 * @return Object
 */
function _categorizeIssues(issues) {
  var categorizedIssues =  {};
  for (cat in config.boardColumns) {
    categorizedIssues[config.boardColumns[cat]] = [];
  }

  for(var i = 0; i < issues.length; i++) {
    for(cat in config.boardColumns) {
      if (issues[i].label.name == config.boardColumns[cat]) {
        categorizedIssues[config.boardColumns[cat]].push(issues[i]);
      }
    }
  }

  return categorizedIssues;
}

router.get('/:repo', function(req, res, next) {
  var repoName = req.params.repo;

  var request = new Request(
    '/repos/'+ config.githubUser + '/'+ repoName + '/issues?state=open&per_page=100',
    'GET',
    {'Authorization': 'token ' + req.signedCookies.accessToken},
    null
  );

  request.do(function(error, response, body) {
    if (error) {
      res.status(500).send(JSON.stringify({"error": error}))
    }

    if (response.statusCode == 200) {
      var parsedRepos = JSON.parse(body);
      var issueList = [];
      for(var i = 0; i < parsedRepos.length; i++) {
        if(parsedRepos[i].labels.length != 0) {
          var issues = {
            'issue_number': parsedRepos[i].number,
            'title': parsedRepos[i].title,
            'url': parsedRepos[i].html_url,
            'assignee': parsedRepos[i].assignee,
            'label': parsedRepos[i].labels[0]
          }

          issueList.push(issues);
        }
      }

      var categorizedIssues = _categorizeIssues(issueList);

      res.render('board', {
        issues: categorizedIssues,
        newIssue: 'https://github.com/' + config.githubUser + '/' + repoName + '/issues/new'
      });
    } else {
      res.status(response.statusCode).send(body);
    }
  });
});

module.exports = router;
