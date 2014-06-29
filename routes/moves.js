/*jslint node: true */
/*jslint nomen: true */
'use strict';

var MovesDailyPlace = require('../models/moves_daily_place'),
    MovesDaySummary = require('../models/moves_day_summary'),
    MovesStoryline = require('../models/moves_storyline'),
    paginate = require('express-paginate'),
    ModelHelper = require('../lib/model_helper'),
    _ = require('underscore');

function getUnique(day) {
    var newarr = [],
        unique = {};

    _.each(day.segments, function (item) {
        if (item.place.name && !unique[item.place.name]) {
            newarr.push(item);
            unique[item.place.name] = item;
        }
    });
    return newarr;
}

function getUniquePlaces(days) {
    _.each(days, function (day, key) {
        days[key].segments = getUnique(day);
    });
    return days;
}
    
exports.dailyPlaces = function (req, res) {
    ModelHelper.paginate(MovesDailyPlace, {}, req, function (paginatedResult) {
        if (req.query && req.query.unique === 'true') {
            paginatedResult['data'] = getUniquePlaces(paginatedResult.data);
        }
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


