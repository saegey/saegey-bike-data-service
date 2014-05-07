// web.js
var express = require("express");
var logfmt = require("logfmt");
var routes = require("./routes");
var movesAuth = require("./routes/moves");
var moment = require('moment');
var http = require("http");
var path = require("path");
var Moves = require("moves");
var moves = new Moves({
  api_base: "https://api.moves-app.com/api/1.1",
  client_id: process.env.MOVES_CLIENT_ID,
  client_secret: process.env.MOVES_CLIENT_SECRET,
  redirect_uri: process.env.MOVES_REDIRECT_URI
});
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = require('./models/user');
var MovesUser = require('./models/moves_user');
var MovesDaySummary = require('./models/moves_day_summary');
var MovesDailyPlace = require('./models/moves_daily_place');

mongoose.connect(process.env.MONGOHQ_URL);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
  console.log("Connected to DB");
});

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (err) { return done(err); }
    if (!user) {
      return done(null, false, { message: "Unknown user " + username });
    }
    user.comparePassword(password, function(err, isMatch) {
      if (err) return done(err);
      if(isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid password' });
      }
    });
  });
}));


var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 5000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(logfmt.requestLogger());
  app.use(express.session({ secret: 'keyboard cat' }));
  // app.use(function(req, res, next) {
  //    res.locals.user = req.user;
  //    next();
  // })

  app.use(function(req, res, next){
    res.locals.moment = require('moment')
    next();
  });
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

  app.use(require('less-middleware')({
    src: __dirname + '/public',
    compress: false
  }));
});

app.configure('development', function () {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.locals.pretty = true;
});

app.configure('production', function () {
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/dashboard', routes.dashboard);
app.get('/moves/authorize', movesAuth.authorize(moves));
app.get('/moves/token', movesAuth.token(moves, MovesUser));

app.get('/dailySummaries', function(req, res) {
  MovesDaySummary.find({}, function(err, summaries) {
    if (!err){
      console.log(summaries);
      res.render('summaries', { summaries: summaries })
    } else { throw err;}
  });
});

app.get('/weeklyBiking', function(req, res) {
  end = moment();
  start = moment().subtract('days', 7)
  MovesDaySummary.find({ summary: { $elemMatch: { activity: 'cycling' } } }, function(err, summaries) {
    if (!err){
      res.json({ summaries: summaries });
    } else { throw err;}
  });
});

app.get('/places', function(req, res) {
  MovesDailyPlace.find({}, function(err, dailyPlaces) {
    if (!err){
      console.log(dailyPlaces);
      res.render('places', { dailyPlaces: dailyPlaces })
    } else { throw err;}
  });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.session.messages });
});

// POST /login
//   This is an alternative implementation that uses a custom callback to
//   acheive the same functionality.
app.post("/login", function(req, res, next) {
  passport.authenticate("local", function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      req.session.messages =  [info.message];
      console.log('user not found');
      return res.redirect('/login')
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/account');
    });
  })(req, res, next);
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

app.listen(app.get("port"));

