/**
 * Util.js
 *
 */
var OAuth = require('oauth').OAuth2;
var config = CONFIG;

exports.sortObject = function (obj) {
var tempArray = [];
var tempObj = {};

for (var key in obj) {
  if (obj.hasOwnProperty(key)) {
    tempArray.push(key);
  }
}

tempArray.sort();

for (var i = 0; i < tempArray.length; i++) {
  tempObj[tempArray[i]] = obj[tempArray[i]];
}

return tempObj;
};


/**
* Authentication filter.
* Used as a middleware on all routes.
*/

exports.isAuthenticated = function (req, res, next) {
  if (req.signedCookies.accessToken) {
    return next();
  } else {
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
      redirect_uri: config.githubRedirectUri,
      scope: ['repo'],
      state: config.githubState
    });

    res.render('index', { authUrl: authUrl });
  }
};