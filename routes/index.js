var express = require('express');
var router = express.Router();
var OAuth = require('oauth').OAuth2;
var qs = require('querystring');
var Request = require('../lib/request');
var util = require('../lib/util');

var config = CONFIG;

var auth = new OAuth(
  config.githubClientId,
  config.githubClientSecret,
  'https://github.com/',
  'login/oauth/authorize',
  'login/oauth/access_token',
  null
);

/**
 * Get currently logged in user details.
 * @param token
 */
function _getUserDetails(token) {
  return new Request(
    '/user',
    'GET',
    token,
    null
  );
}

/**
 * Get user organization details.
 * @param user
 * @user token
 */
function _getUserOrganizations(user, token) {
  return new Request(
    '/users/' + user + '/orgs',
    'GET',
    token,
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
      maxAge: 25920000000,
      signed: signed
    }
  );
}

/* Home page */
router.get('/', util.isAuthenticated, function(req, res, next) {
  res.redirect('/repos');
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
        res.status(500).send(JSON.stringify({ error: error }));
      } else if (results.error) {
        console.log(results.error);
        res.status(401).send(JSON.stringify(results));
      } else {
        res.locals.githubAccessToken = accessToken;
        _setCookie(res, 'accessToken', accessToken, true);
        // Go on to next handler
        next();
      }
    }
  )
}, function(req, res, next) {
  var userDetails = _getUserDetails(res.locals.githubAccessToken);
  userDetails.do(function(error, response, body) {
    if (error) {
      console.log(error);
      res.status(500).send(error);
    }

    if (response.statusCode != 200) {
      console.log('Unexpected response from Github ' + response.statusCode);
      res.status(response.StatusCode).send(body);
    } else {
      res.locals.githubUser = JSON.parse(body).login;
      _setCookie(res, 'githubUser', JSON.parse(body).login, false);

      next();
    }
  })
}, function(req, res) {
  var orgs = _getUserOrganizations(res.locals.githubUser, res.locals.githubAccessToken);
  orgs.do(function(error, response, body) {
    if (error) {
      res.status(500).send(error);
      console.log('Error getting user orgs ' + error);
    }

    if (response.statusCode == 200) {
      var parsedResponse = JSON.parse(body);
      var orgs = [];

      if (parsedResponse.length > 0) {
        for(var i = 0; i < parsedResponse.length; i++) {
          orgs.push(parsedResponse[i].login);
        }

        _setCookie(res, 'githubOrganizations', orgs, false);
      }

      res.redirect('/');
    } else {
      console.log('Unexpected response from Github ' + response.statusCode);
      res.status(response.StatusCode).send(body);
    }
  });
});

/* Logout and destroy the session */
router.get('/logout', function(req, res, next) {
  req.session = null;
  res.clearCookie('accessToken');
  res.clearCookie('githubUser');
  res.clearCookie('githubOrganizations');
  res.render('logout');
});

module.exports = router;
