/*jslint node: true */
/*jslint nomen: true */
'use strict';
require('newrelic');

var express = require("express"),
    logfmt = require("logfmt"),
    routes = require("./routes"),
    moves = require("./routes/moves"),
    instagram = require('./routes/instagram'),
    path = require("path"),
    rollbar = require('rollbar'),
    mongoose = require('mongoose'),
    paginate = require('express-paginate');

mongoose.connect(process.env.MONGO_URL);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
    console.log("Connected to DB");
});

var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 5000);
    app.use(express.cookieParser());
    app.use(allowCrossDomain);
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(logfmt.requestLogger());
    app.use(express.session({ secret: 'keyboard cat' }));
    app.use(app.router);
    app.use(paginate.middleware(10, 50));
});

app.configure('development', function () {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
    app.locals.pretty = true;
});

app.configure('production', function () {
    if (process.env.ROLLBAR_POST_SERVER_ITEM) {
        app.use(rollbar.errorHandler(process.env.ROLLBAR_POST_SERVER_ITEM));
    }
});

app.get('/', routes.index);
app.get('/moves/authorize', moves.authorizeUser);
app.get('/moves/token', moves.handleAuth);
app.get('/moves/dailyPlaces', moves.dailyPlaces);
app.get('/moves/dailySummaries', moves.dailySummaries);
app.get('/moves/storyline', moves.storyline);
app.get('/moves/strava', moves.strava);
app.get('/v1/instagram/authorize', instagram.authorizeUser);
app.get('/v1/instagram/token', instagram.handleAuth);
app.get('/v1/instagram/photos', instagram.userPhotos);
app.get('/v1/instagram/liked', instagram.likedPhotos);
app.get('/v1/instagram/tag/:tag', instagram.taggedPhotos);

app.get('/throw/some/error', function(){
  throw {
    status: 500,
    message: 'we just threw an error for a test case!'
  };
});

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

app.listen(app.get("port"));

