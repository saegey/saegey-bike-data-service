/*jslint node: true */
/*jslint nomen: true */
'use strict';

var MovesDailyPlace = require('../models/moves_daily_place'),
    MovesDaySummary = require('../models/moves_day_summary'),
    MovesStoryline = require('../models/moves_storyline'),
    StravaClient = require("strava"),
    paginate = require('express-paginate');

function modelPaginate(model, filter, req, next) {
    model.paginate(filter, req.query.page, req.query.limit, function(err, pageCount, items, itemCount) {
        if (err) { throw err; }
        next({
            object: 'list',
            has_more: paginate.hasNextPages(req)(pageCount),
            data: items
        })
    }, { sortBy : { date : -1 } });
}

exports.dailyPlaces = function (req, res) {
    modelPaginate(MovesDailyPlace, {}, req, function (paginatedResult) {
        res.json(paginatedResult);
    });
};

exports.dailySummaries = function (req, res) {
    modelPaginate(MovesDaySummary, {}, req, function (paginatedResult) {
        res.json(paginatedResult);
    });
};

exports.storyline = function (req, res) {
    function convertDate(d) {
        return new Date(d.substr(0, 4) + "-" + d.substr(4, 2) + "-" + d.substr(6, 2));
    }
    if (req.query.date) {
        var requestedDate = convertDate(req.query.date);
        MovesStoryline.find({date: requestedDate}).exec(function (err, storyline) {
            if (err) { throw err; }
            res.json(storyline);
        });
    } else {
        modelPaginate(MovesStoryline, {}, req, function (paginatedResult) {
            res.json(paginatedResult);
        });
    }
};

var strava = new StravaClient({
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    redirect_uri: process.env.STRAVA_REDIRECT_URI,
    access_token: process.env.STRAVA_ACCESS_TOKEN
});

exports.strava = function (req, res) {
    strava.athlete.activities.get({}, function (err, res) {
        console.log(res[0]);
        MovesStoryline.findById(res[0].external_id.split(".")[0], function (err, res) {
            console.log(res);
        });
    });
    res.send(200);
};

