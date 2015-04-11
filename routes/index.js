var express = require('express');
var router = express.Router();
var OAuth = require('oauth').OAuth2;
var qs = require('querystring');
var Request = require('../lib/request');

var config = CONFIG;
var githubAccessToken;

var auth = new OAuth(
  config.githubClientId,
  config.githubClientSecret,
  'https://github.com/',
  'login/oauth/authorize',
  'login/oauth/access_token',
  null
);

/* Get the authorize URL from Github */
var authUrl = auth.getAuthorizeUrl({
  redirect_uri: process.env.GITHUB_OAUTH_REDIRECT_URI + '/login',
  scope: ['repo'],
  state: config.githubState
});

/**
 * Check if an access token has already been issued.
 * @param req
 * @returns boolean
 */
function isAuthenticated(req) {
  if (req.signedCookies.accessToken) {
    return true;
  }
  return false;
}

/**
 * Get currently logged in user details.
 * @param token
 */
function _getUserDetails(token) {
  return new Request(
    '/user',
    'GET',
    {Authorization: 'token ' + token},
    null
  );
}

/**
 * Set cookies.
 * @param res
 * @param key
 * @param value
 * @param signed
 */
function _setCookie(res, key, value, signed) {
  res.cookie(
    key,
    value,
    {
      maxAge: 2592000000,
      signed: signed
    }
  );
}

/* Home page */
router.get('/', function(req, res, next) {
  if (!isAuthenticated(req)) {
    res.render('index', {authUrl: authUrl});
  } else {
    res.redirect('/repos');
  }
});

/**
 * Request a Github OAuth access token.
 * It is then set in the cookies.
 */
router.get('/login', function(req, res, next) {
  var query = qs.parse(req.url.split('?')[1]);

  auth.getOAuthAccessToken(
    query.code,
    {'redirect_uri': process.env.GITHUB_OAUTH_REDIRECT_URI},
    function(error, accessToken, refreshToken, results) {
      if (error) {
        console.log(error);
        res.status(500).send(JSON.stringify({error: error}));
      } else if (results.error) {
        console.log(results.error);
        res.status(401).send(JSON.stringify(results));
      } else {
        githubAccessToken = accessToken;
        // Go on to next handler
        next();
      }
    }
  )
}, function(req, res) {
  var userDetails = _getUserDetails(githubAccessToken);
  userDetails.do(function(error, response, body) {
    if (error) {
      console.log(error);
      res.status(500).send(JSON.stringify({error: error}));
    }

    if (response.statusCode != 200) {
      console.log('Unexpected response from Github ' + response.statusCode);
      res.status(response.StatusCode).send(JSON.stringify({error: body}));
    } else {
      var githubUser = JSON.parse(body).login;
      _setCookie(res, 'accessToken', githubAccessToken, true);
      _setCookie(res, 'githubUser', githubUser, false);

      res.redirect('/');
    }
  })
});

/* Logout and destroy the session */
router.get('/logout', function(req, res, next) {
  req.session = null;
  res.clearCookie('accessToken');
  res.clearCookie('githubUser');
  res.render('logout');
});

module.exports = router;
