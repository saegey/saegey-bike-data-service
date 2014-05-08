var kue = require('kue');
var schedule = require('node-schedule');
var moment = require('moment');
var jobs = kue.createQueue({
  redis: {
    port: process.env.REDIS_PORT_6379_TCP_PORT,
    host: process.env.REDIS_PORT_6379_TCP_ADDR
  }
});
var minute = 100;
var mongoose = require('mongoose');
var MovesDataStorageService = require('./services/moves_data_storage_service');

mongoose.connect(process.env.MONGO_URL);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
  console.log("Connected to DB");
});

var j = schedule.scheduleJob('0 */2 * * *', function() {
  jobs.create('updateMovesData', {
    title: 'Update moves data',
    username: 'adams'
  }).priority('high').save();
});

jobs.process('updateMovesData', 10, function (job, done) {
  var dataStorageService = new MovesDataStorageService(job.data.username);
  dataStorageService.syncDailySummary();
  dataStorageService.syncDailyPlaces();
  done();
});

kue.app.listen(3000);