var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var Pusher = require('pusher');

try {
  CONFIG = require('./config.json');
} catch (ex) {
  CONFIG = {
    "githubClientId": process.env.GITHUB_CLIENT_ID,
    "githubClientSecret": process.env.GITHUB_CLIENT_SECRET,
    "githubState": process.env.GITHUB_STATE,
    "cookieSecret": process.env.COOKIE_SECRET,
    "boardColumns": ["ready", "development", "review", "release", "done"],
    "pusherAppId": process.env.PUSHER_APP_ID,
    "pusherKey": process.env.PUSHER_KEY,
    "pusherSecret": process.env.PUSHER_SECRET,
    "eventinatorKey": process.env.EVENTINATOR_KEY,
    "githubRedirectUri": process.env.GITHUB_OAUTH_REDIRECT_URI
  }
}

PUSHER = new Pusher({
  appId: CONFIG.pusherAppId,
  key: CONFIG.pusherKey,
  secret: CONFIG.pusherSecret
});

var app = express();

var index = require('./routes/index')
  , repo = require('./routes/repo')
  , board = require('./routes/board')
  , issues = require('./routes/issues')
  , pusher = require('./routes/pusher')
  , webhooks = require('./routes/webhooks');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(CONFIG.cookieSecret));
app.use(session({
  secret: CONFIG.cookieSecret,
  cookie: {
    maxAge: 2592000000,
    signed: true
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/repos', repo);
app.use('/board', board);
app.use('/issues', issues);
app.use('/pusher', pusher);
app.use('/webhooks', webhooks);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
