/*jslint node: true */
/*jslint nomen: true */
'use strict';
require('newrelic');

var express = require("express"),
    logfmt = require("logfmt"),
    routes = require("./routes"),
    moves = require("./routes/moves"),
    auth = require("./routes/auth"),
    strava = require("./routes/strava"),
    instagram = require('./routes/instagram'),
    bikes = require('./routes/bikes'),
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

// oauth helper endpoints
app.get('/', routes.index);
app.get('/auth/moves/authorize', auth.authorizeMovesUser);
app.get('/auth/moves/token', auth.handleMovesAuth);
app.get('/auth/instagram/authorize', auth.authorizeInstagramUser);
app.get('/auth/instagram/token', auth.handleInstagramAuth);

// moves endpoints
app.get('/v1/moves/places', moves.dailyPlaces);
app.get('/v1/moves/summary', moves.dailySummaries);
app.get('/v1/moves/storyline', moves.storyline);

// instagram endpoints
app.get('/v1/instagram/photos', instagram.userPhotos);
app.get('/v1/instagram/liked', instagram.likedPhotos);
app.get('/v1/instagram/tag/:tag', instagram.taggedPhotos);

// bike endpoints
app.get('/v1/bikes', bikes.index);
app.get('/v1/bikes/:tag', bikes.show);

// strava endpoints
app.get('/v1/strava/activities', strava.activities);

app.listen(app.get("port"));

