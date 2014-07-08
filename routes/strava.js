/*jslint node: true */
/*jslint nomen: true */
'use strict';

var StravaActivity = require("../models/strava_activity"),
    ModelHelper = require('../lib/model_helper'),
    MovesStoryline = require('../models/moves_storyline'),
    _ = require('underscore'),
    moment = require('moment'),
    gpx = require('../services/gpx'),
    MovesStravaUploadService = require('../services/moves_strava_upload_service');

exports.activities = function (req, res) {
    ModelHelper.paginate(StravaActivity, {}, req, function (paginatedResult) {
        res.json(paginatedResult);
    });
};

exports.upload = function (req, res) {
    var parentIds = [],
        activityIds = [];

    req.body.forEach(function(result) {
        parentIds.push(result.parentId);
        activityIds.push(result.id);
    });
    MovesStoryline.findByActivityIds(parentIds, activityIds, function (err, activities, results) {
        if (err) { throw err; }
        gpx.createGPX(activities, function (err, output) {
            MovesStravaUploadService.uploadNewRides(output, function(stravaId) {
                MovesStoryline.updateStravaId(results, activityIds, stravaId, function(activities) {
                    res.send({ data: activities });
                });
            });
        });
    });
}



