/*jslint node: true */
/*jslint nomen: true */
'use strict';

var Moves = require("moves"),
    MovesStoryline = require('../models/moves_storyline'),
    _ = require('underscore'),
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

function MovesStravaUploadService() {}

MovesStravaUploadService.prototype.uploadNewRides = function () {
    MovesStoryline.find({includesCycling: true, stravaId: null }).exec(function (err, storylines) {
        if (err) { throw err; }
        _.each(storylines, function(storyline) {
            console.log("Uploading to Strava - " + storyline.date);
            gpx.createGPX(storyline, function (err, output) {
                if (err) {
                    console.log(err);
                } else {
                    var stravaOptions = {
                        data_type: 'gpx',
                        data: output,
                        external_id: storyline.id,
                        name: "New Ride",
                        wait: true
                    };
                    strava.uploads.upload(stravaOptions, function (err, body) {
                        if (err) { throw err; }
                        console.log("Activity id = " + body.activity_id);
                        storyline.stravaId = body.activity_id;
                        storyline.save(function(err) {
                            if (err) { throw err; }
                        });
                        // console.log(body);
                    });
                }
            });
        });
    });
};

module.exports = MovesStravaUploadService;