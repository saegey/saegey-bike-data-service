/*jslint node: true */
/*jslin nomen: true */
'use strict';

var kue = require('kue');
var jobs = kue.createQueue({
    redis: {
        port: process.env.REDIS_PORT_6379_TCP_PORT,
        host: process.env.REDIS_PORT_6379_TCP_ADDR
    }
});
var mongoose = require('mongoose');
var MovesDataStorageService = require('./services/moves_data_storage_service');
var MovesUserApiService = require('./services/moves_user_api_service');

var dataStorageService = new MovesDataStorageService('adams');
dataStorageService.syncStoryline();

mongoose.connect(process.env.MONGO_URL);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
    console.log("Connected to DB");
});

function newJob() {
    var job = jobs.create('new_job', {
        title: 'Update moves data',
        username: 'adams'
    });
    job.save();
}

setInterval(newJob, 30000);

jobs.process('new_job', function (job, done) {
    var dataStorageService = new MovesDataStorageService(job.data.username);
    dataStorageService.syncDailySummary();
    dataStorageService.syncDailyPlaces();
    done();
});

kue.app.listen(3000);