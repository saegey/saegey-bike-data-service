var kue = require('kue');
var schedule = require('node-schedule');
var moment = require('moment');
var jobs = kue.createQueue();
var minute = 100;
var mongoose = require('mongoose');
var MovesDataStorageService = require('./services/moves_data_storage_service');

mongoose.connect(process.env.MONGOHQ_URL);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
  console.log("Connected to DB");
});

var j = schedule.scheduleJob('* * * * *', function() {
  var summary = jobs.create('movesDailySummary', {
    title: 'Update movesDailySummary',
    username: 'adams'
  }).priority('high').save();
});


// email.on('complete', function () {
//   console.log('renewal job completed');
// });

var dataStorageService = new MovesDataStorageService('adams');
dataStorageService.syncDailySummary();
dataStorageService.syncDailyPlaces();

// jobs.process('movesDailySummary', 10, function (job, done) {
//   getMovesDailySummary(job.data.username, function(summaries) {
//     console.log(summaries);
//     updateMovesSummaries(summaries);
//   });
//   done();
// });

kue.app.listen(3000);