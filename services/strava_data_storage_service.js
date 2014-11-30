/*jslint node: true */
/*jslint nomen: true */
'use strict';

var StravaClient = require("strava"),
    stravaApi = new StravaClient({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        redirect_uri: process.env.STRAVA_REDIRECT_URI,
        access_token: process.env.STRAVA_ACCESS_TOKEN
    }),
    StravaActivity = require("../models/strava_activity"),
    StravaGear = require("../models/strava_gear");

function StravaDataStorageService() {}

StravaDataStorageService.saveActivities = function(page) {
    if (!page) { var page = 1; }
    stravaApi.athlete.activities.get({page: page}, function (err, results) {
        if (err) { throw err; }
        results.forEach(function (a) {
            StravaActivity.findOneAndUpdate({id: a.id}, a, ['upsert'], function(err, result) {
                if (err) { throw err; }
                if (!result) {
                    var stravaActivity = new StravaActivity(a);
                    stravaActivity.save();
                    if (stravaActivity.gear_id) {
                        StravaDataStorageService.createOrUpdateGear(
                            stravaActivity.gear_id
                        );
                    }
                } else {
                    if (result.gear_id) {
                        StravaDataStorageService.createOrUpdateGear(
                            result.gear_id
                        );
                    }
                }
            });
        });
        if (results.length > 0) {
            StravaDataStorageService.saveActivities(page + 1);
        }
    });
}

StravaDataStorageService.createOrUpdateGear = function(gearId) {
    StravaGear.findOne({ id: gearId }, function (err, result) {
        if (err) { throw err; }
        if (!result) {
            stravaApi.gear.get(gearId, {}, function (err, gear) {
                var stravaGear = new StravaGear(gear);
                stravaGear.save();
            });
        }
    });
}

module.exports = StravaDataStorageService;
