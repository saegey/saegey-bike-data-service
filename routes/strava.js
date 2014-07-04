/*jslint node: true */
/*jslint nomen: true */
'use strict';

var StravaActivity = require("../models/strava_activity"),
    ModelHelper = require('../lib/model_helper');

exports.activities = function (req, res) {
    ModelHelper.paginate(StravaActivity, {}, req, function (paginatedResult) {
        res.json(paginatedResult);
    });
};
