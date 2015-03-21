var express = require('express');
var router = express.Router();
var OAuth = require('oauth').OAuth2;
var qs = require('querystring');

var config = require('../config.json');

var auth = new OAuth(
  config.clientId,
  config.clientSecret,
  'https://github.com/',
  'login/oauth/authorize',
  'login/oauth/access_token',
  null
);

var authUrl = auth.getAuthorizeUrl({
  redirect_uri: 'http://localhost:3000/login',
  scope: ['repo'],
  state: config.githubState
});

function isAuthenticated(req) {
  if (req.session.github_access_token) {
    return true;
  }
  return false;
}

router.get('/', function(req, res, next) {
  if (!isAuthenticated(req)) {
    res.redirect(authUrl);
  } else {
    res.render('index');
  }
});

router.get('/login', function(req, res, next) {
  var query = qs.parse(req.url.split('?')[1]);
  auth.getOAuthAccessToken(
    query.code,
    {'redirect_uri': 'http://localhost:3000/'},
    function(error, accessToken, refreshToken, results) {
      if (error) {
        res.status(500).send(JSON.stringify({"error": error}));
      } else if (results.error) {
        res.status(401).send(JSON.stringify(results));
      } else {
        req.session.github_access_token = accessToken;
        res.redirect('/');
      }
    }
  )
});

module.exports = router;
