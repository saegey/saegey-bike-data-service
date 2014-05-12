/*jslint node: true */
/*jslin nomen: true */
'use strict';
/*global require, module,  __dirname */
var express = require("express");
var logfmt = require("logfmt");
var routes = require("./routes");
var movesAuth = require("./routes/moves");
var moment = require('moment');
// var path = require("path");
var Moves = require("moves");
var GitHubStrategy = require('passport-github').Strategy;

var moves = new Moves({
    api_base: "https://api.moves-app.com/api/1.1",
    client_id: process.env.MOVES_CLIENT_ID,
    client_secret: process.env.MOVES_CLIENT_SECRET,
    redirect_uri: process.env.MOVES_REDIRECT_URI
});
var passport = require('passport');
var mongoose = require('mongoose');

var User = require('./models/user');
var MovesUser = require('./models/moves_user');
var MovesDaySummary = require('./models/moves_day_summary');
var MovesDailyPlace = require('./models/moves_daily_place');

mongoose.connect(process.env.MONGO_URL);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
    console.log("Connected to DB");
});

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete GitHub profile is serialized
//   and deserialized.
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (user, done) {
    User.find({id: user.id}, function (err, user) {
        done(err, user);
    });
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL
}, function (accessToken, refreshToken, profile, done) {
    // var profile = JSON.parse(profile);
    profile.githubId = profile.id;
    User.findOneAndUpdate({ githubId: profile.id }, profile, ['upsert'], function (err, result) {
        console.log(profile);
        if (err) { throw err; }
        if (!result) {
            var user = new User(profile);
            user.save(function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Created: [User] ' + profile.id);
                    done();
                }
            });
        } else {
            console.log('Updated: [User] ' + result.githubId);
            done();
        }
    });
}
));

var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 5000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(allowCrossDomain);
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(logfmt.requestLogger());
    app.use(express.session({ secret: 'keyboard cat' }));

    app.use(function (req, res, next) {
        res.locals.moment = require('moment');
        next();
    });

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

app.get('/dailySummaries.json', function (req, res) {
    MovesDaySummary.find({}).sort('-date').exec(function (err, summaries) {
        if (!err) {
            res.json({ summaries: summaries });
        } else {
            throw err;
        }
    });
});

app.get('/dailyPlaces.json', function (req, res) {
    MovesDailyPlace.find().sort('-date').exec(function (err, dailyPlaces) {
        if (!err) {
            res.json({ dailyPlaces: dailyPlaces });
        } else {
            throw err;
        }
    });
});

// app.get('/weeklyBiking', function(req, res) {
//   end = moment();
//   start = moment().subtract('days', 7)
//   MovesDaySummary.find({ summary: { $elemMatch: { activity: 'cycling' } } }, function(err, summaries) {
//     if (!err){
//       res.json({ summaries: summaries });
//     } else { throw err;}
//   });
// });

app.get('/login', function (req, res) {
    res.render('login', { user: req.user });
});

// GET /auth/github
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in GitHub authentication will involve redirecting
//   the user to github.com.  After authorization, GitHubwill redirect the user
//   back to this application at /auth/github/callback
app.get('/auth/github', passport.authenticate('github'));

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/dailySummaries');
    });

app.get('/logout', function (req, res){
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
    res.redirect('/login');
}

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

app.listen(app.get("port"));

