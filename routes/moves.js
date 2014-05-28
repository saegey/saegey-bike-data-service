/*jslint node: true */
/*jslint nomen: true */
'use strict';

var Moves = require("moves"),
    MovesDailyPlace = require('../models/moves_daily_place'),
    MovesDaySummary = require('../models/moves_day_summary'),
    MovesStoryline = require('../models/moves_storyline'),
    StravaClient = require("strava"),
    gpx = require('../services/gpx'),
    moves = new Moves({
        api_base: "https://api.moves-app.com/api/1.1",
        client_id: process.env.MOVES_CLIENT_ID,
        client_secret: process.env.MOVES_CLIENT_SECRET,
        redirect_uri: process.env.MOVES_REDIRECT_URI
    }),
    strava = new StravaClient({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        redirect_uri: process.env.STRAVA_REDIRECT_URI,
        access_token: process.env.STRAVA_ACCESS_TOKEN
    });

exports.authorizeUser = function (req, res) {
    res.redirect(
        moves.authorize({scope: ['activity', 'location'], state: '123'})
    );
};

exports.handleAuth = function (req, res) {
    moves.token(req.query.code, function (err, result, body) {
        if (err) {
            console.log(err.body);
            res.send("Didn't work");
        } else {
            var parsedBody = JSON.parse(body);
            res.send('Ya! Access token is ' + parsedBody.access_token + ' Refresh token is ' + parsedBody.refresh_token);
        }
    });
};

exports.dailyPlaces = function (req, res) {
    MovesDailyPlace.find().sort('-date').exec(function (err, results) {
        if (!err) {
            res.json({ dailyPlaces: results });
        } else {
            throw err;
        }
    });
};

exports.dailySummaries = function (req, res) {
    MovesDaySummary.find({}).sort('-date').exec(function (err, summaries) {
        if (!err) {
            res.json({ dailySummaries: summaries });
        } else {
            throw err;
        }
    });
};

exports.storyline = function (req, res) {
    MovesStoryline.find({}).sort('-date').exec(function (err, storyline) {
        if (!err) {
            res.json({ storyline: storyline });
        } else {
            throw err;
        }
    });
};

exports.gpx = function (req, res) {
    MovesStoryline.find().sort('-date').exec(function (err, storylines) {
        if (err) { throw err; }
        gpx.createGPX(storylines[req.query.storyline], function (err, output) {
            if (err) { 
                console.log(err);
                res.send("No cycling inputs");
            } else {
                res.send(output);
            }
        });
    });
};

exports.strava = function (req, res) {
    strava.athlete.activities.get({}, function (err, res) {
        console.log(res[0]);
        MovesStoryline.findById(res[0].external_id.split(".")[0], function (err, res) {
            console.log(res);
        });
    });
    res.send(200);
};

