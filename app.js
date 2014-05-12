/*jslint node: true */
/*jslint nomen: true */
'use strict';

var express = require("express"),
    logfmt = require("logfmt"),
    routes = require("./routes"),
    moves = require("./routes/moves"),
    instagramAuth = require('./routes/instagram'),
    path = require("path"),
    mongoose = require('mongoose');

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
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
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
app.get('/moves/authorize', moves.authorizeUser);
app.get('/moves/token', moves.handleAuth);
app.get('/moves/dailyPlaces', moves.dailyPlaces);
app.get('/moves/dailySummaries', moves.dailySummaries);
app.get('/moves/storyline', moves.storyline);
app.get('/instagram/authorize', instagramAuth.authorizeUser);
app.get('/instagram/token', instagramAuth.authorizeUser);

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

app.get('/logout', function (req, res){
    req.logout();
    res.redirect('/');
});

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

app.listen(app.get("port"));

