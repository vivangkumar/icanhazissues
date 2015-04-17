var express = require('express');
var router = express.Router();
var Request = require('../lib/request');
var util = require('../lib/util');

var config = CONFIG;

router.get('/', util.isAuthenticated, function(req, res, next) {
  res.render('repo');
});

router.get('/search', util.isAuthenticated, function(req, res, next) {
  var query = req.query.repo;
  var userOrganizations = req.cookies.githubOrganizations || [];
  var githubUser = req.cookies.githubUser;
  var userQuery = '';
  userOrganizations.push(githubUser);

  for (var org in userOrganizations) {
    userQuery += 'user:' + userOrganizations[org] + '+';
  }

  if (query == '') {
    res.render('repo', { error: 'Please enter a search term' });
  } else {
    var request = new Request(
      '/search/repositories?q='+ query +'+in:name+' + userQuery.slice(0, -1),
      'GET',
      req.signedCookies.accessToken,
      null
    );

    request.do(function(error, response, body) {
      if (error) {
        console.log('Error ' + error + ' Status code 500');
        res.render('repo', { error: 'There was an error querying the Github API.' });
      }

      if (response.statusCode == 200) {
        var repoNames = [];
        var parsedRepos = JSON.parse(body).items;
        for (var i = 0; i < parsedRepos.length; i++) {
          repoNames.push(parsedRepos[i].full_name);
        }
        res.render('repo', { repoNames: repoNames });
      } else {
        console.log('Error ' + body + ' Status code ' + response.statusCode);
        res.render('repo', { error: 'There was an error querying the Github API.' });
      }
    });
  }
});

module.exports = router;
