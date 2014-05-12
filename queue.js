/*jslint node: true */
/*jslin nomen: true */
'use strict';

var kue = require('kue'),
    jobs = kue.createQueue({
        redis: {
            port: process.env.REDIS_PORT_6379_TCP_PORT,
            host: process.env.REDIS_PORT_6379_TCP_ADDR
        }
    }),
    mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
    console.log("Connected to DB");
});

var MovesDataStorageService = require('./services/moves_data_storage_service');
var MovesUserApiService = require('./services/moves_user_api_service');

var dataStorageService = new MovesDataStorageService(process.env.MOVES_ACCESS_TOKEN);
dataStorageService.syncDailyPlaces();

function updateMovesData() {
    var job = jobs.create('update_moves_data', {
        title: 'Update moves data',
        accessToken: process.env.MOVES_ACCESS_TOKEN
    });
    job.save();
}

// setInterval(updateMovesData, process.env.MOVES_UPDATE_INTERVAL || 30000);

jobs.process('update_moves_data', function (job, done) {
    var dataStorageService = new MovesDataStorageService(job.data.accessToken);
    // dataStorageService.syncDailySummary();
    dataStorageService.syncDailyPlaces();
    done();
});

kue.app.listen(3000);