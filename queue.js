/*jslint node: true */
'use strict';

var kue = require('kue'),
    jobs = kue.createQueue({
        redis: {
            port: process.env.REDIS_PORT_6379_TCP_PORT,
            host: process.env.REDIS_PORT_6379_TCP_ADDR
        }
    }),
    mongoose = require('mongoose'),
    express = require("express");

mongoose.connect(process.env.MONGO_URL);

if (process.env.ROLLBAR_POST_SERVER_ITEM) {
    var rollbar = require("rollbar");
    rollbar.init(process.env.ROLLBAR_POST_SERVER_ITEM);
}

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
    console.log("Connected to DB");
});

var MovesDataStorageService = require('./services/moves_data_storage_service');
var MovesUserApiService = require('./services/moves_user_api_service');
var MovesStravaUploadService = require('./services/moves_strava_upload_service');
var InstagramDataStorageService = require('./services/instagram_data_storage_service');

function updateMovesData() {
    var job = jobs.create('update_moves_data', {
        title: 'Update moves data',
        accessToken: process.env.MOVES_ACCESS_TOKEN
    });
    job.save();
}

function updateInstagramData() {
    var job = jobs.create('update_instagram_data', {
        title: 'Update instagram data'
    });
    job.save();
}

jobs.process('update_moves_data', function (job, done) {
    try {
        var dataStorageService = new MovesDataStorageService(job.data.accessToken);
        dataStorageService.syncDailySummary();
        dataStorageService.syncDailyPlaces();
        dataStorageService.syncStoryline();
        // var stravaService = new MovesStravaUploadService();
        // stravaService.uploadNewRides();
    } catch (ex) {
        if (typeof rollbar == 'function') {
            if (err) { rollbar.reportMessage(err); }
        }
    }
    done();
});

jobs.process('update_instagram_data', function (job, done) {
    try {
        var igSvc = new InstagramDataStorageService();
        igSvc.syncLikedPhotos();
        igSvc.syncUserPhotos();
    } catch (ex) {
        if (typeof rollbar == 'function') {
            if (err) { rollbar.reportMessage(err); }
        }
    }
    done();
});

setInterval(updateMovesData, process.env.MOVES_UPDATE_INTERVAL || 30000);
setInterval(updateInstagramData, process.env.MOVES_UPDATE_INTERVAL || 30000);

// kue UI
var app = express();
app.use(express.basicAuth(process.env.KUE_USERNAME, process.env.KUE_PASSWORD));
app.use(kue.app);
app.listen(3000);
