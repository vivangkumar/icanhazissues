var express = require('express');
var router = express.Router();
var Request = require('../lib/request');

var config = CONFIG;

router.get('/', function(req, res, next) {
  res.render('repo');
});

router.get('/search', function(req, res, next) {
  var query = req.query.repo;
  if (query == '') {
    res.render('repo', {error: 'Please enter a search term'});
  } else {
    var request = new Request(
      '/search/repositories?q='+ query +'+in:name+user:' + config.githubUser,
      'GET',
      {Authorization: 'token ' + req.signedCookies.accessToken},
      null
    );

    request.do(function(error, response, body) {
      if (error) {
        res.render('error', {
          message: error,
          error: {
            status: 500
          }
        });
      }

      if (response.statusCode == 200) {
        var repoNames = [];
        var parsedRepos = JSON.parse(body).items;
        for (var i = 0; i < parsedRepos.length; i++) {
          repoNames.push(parsedRepos[i].full_name);
        }
        res.render('repo', {repoNames: repoNames});
      } else {
        res.render('error', {
          message: body.message,
          error: {
            status: response.statusCode,
          }
        });
      }
    });
  }
});

module.exports = router;
