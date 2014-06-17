/*jslint node: true */
/*jslint nomen: true */
'use strict';

var MovesDailyPlace = require('../models/moves_daily_place'),
    MovesDaySummary = require('../models/moves_day_summary'),
    MovesStoryline = require('../models/moves_storyline'),
    paginate = require('express-paginate'),
    ModelHelper = require('../lib/model_helper');
    
exports.dailyPlaces = function (req, res) {
    ModelHelper.paginate(MovesDailyPlace, {}, req, function (paginatedResult) {
        res.json(paginatedResult);
    });
};

exports.dailySummaries = function (req, res) {
    ModelHelper.paginate(MovesDaySummary, {}, req, function (paginatedResult) {
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
        ModelHelper.paginate(MovesStoryline, {}, req, function (paginatedResult) {
            res.json(paginatedResult);
        });
    }
};


