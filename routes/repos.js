var express = require('express');
var router = express.Router();
var Request = require('../lib/request');

/* GET repos listing. */
router.get('/', function(req, res, next) {
  var req = new Request(
    '/orgs/pusher/repos',
    'GET',
    {'Authorization': 'token ' + req.signedCookies.access_token}
  );

  req.do(function(error, response, body) {
    if (error) {
      res.status(500).send(JSON.stringify({"error": error}))
    }

    if (response.statusCode == 200) {
      var repoNames = [];
      var repoJSON = JSON.parse(body);

      for(repo in repoJSON) {
        repoNames.push(repoJSON[repo].name)
      }
      res.render('repos', {repoNames: repoNames});
    } else {
      res.status(response.statusCode).send(body);
    }
  });
});

module.exports = router;
