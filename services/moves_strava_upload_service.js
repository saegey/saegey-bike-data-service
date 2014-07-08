/*jslint node: true */
/*jslint nomen: true */
'use strict';

var StravaClient = require("strava"),
    strava = new StravaClient({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        redirect_uri: process.env.STRAVA_REDIRECT_URI,
        access_token: process.env.STRAVA_ACCESS_TOKEN
    });

function MovesStravaUploadService() {}

MovesStravaUploadService.uploadNewRides = function (gpx, callback) {
    var stravaOptions = {
        data_type: 'gpx',
        data: gpx,
        name: "New Ride",
        wait: true
    };
    strava.uploads.upload(stravaOptions, function (err, body) {
        console.log(body);
        if (err) { throw err; }
        return callback(body.activity_id);
    });
};

module.exports = MovesStravaUploadService;