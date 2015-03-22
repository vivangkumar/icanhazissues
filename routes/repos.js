var express = require('express');
var router = express.Router();
var Request = require('../lib/request');

router.get('/', function(req, res, next) {
  res.render('repos');
})

router.get('/search', function(req, res, next) {
  var query = req.query.repo;
  var request = new Request(
    '/search/repositories?q='+query+'+in:name+user:pusher',
    'GET',
    {'Authorization': 'token ' + req.signedCookies.access_token}
  );

  request.do(function(error, response, body) {
    if (error) {
      res.status(500).send(JSON.stringify({"error": error}))
    }

    if (response.statusCode == 200) {
      var repoNames = [];
      var parsedRepos = JSON.parse(body).items;
      for(var i = 0; i < parsedRepos.length; i++) {
        repoNames.push(parsedRepos[i].name);
      }
      res.render('repos', {repoNames: repoNames});
    } else {
      res.status(response.statusCode).send(body);
    }
  });
});

module.exports = router;
