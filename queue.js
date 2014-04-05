var kue = require('kue');
var schedule = require('node-schedule');
var jobs = kue.createQueue();
var minute = 100;
var Moves = require("moves");
var moves = new Moves({
  api_base: "https://api.moves-app.com/api/1.1",
  client_id: process.env.MOVES_CLIENT_ID,
  client_secret: process.env.MOVES_CLIENT_SECRET,
  redirect_uri: process.env.MOVES_REDIRECT_URI
});
var mongoose = require('mongoose');
var MovesUser = require('./models/moves_user');
var MovesDaySummary = require('./models/moves_day_summary');
var MovesLog = require('./models/moves_log');

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

jobs.process('movesDailySummary', 10, function (job, done) {
  getMovesDailySummary(job.data.username, function(summaries) {
    updateMovesSummaries(summaries);
  });
  done();
});

function parseMovesDate(dateString) {
  return dateString.substr(4,2) + "/" + dateString.substr(6,2) +
    "/" + dateString.substr(0,4);
}

function updateMovesSummaries(summaries) {
  for (i = 0; i < summaries.length; ++i) {
    summaries[i].date = parseMovesDate(summaries[i].date.toString());
    var query = { date: summaries[i].date };
    MovesDaySummary.findOne(query, function(err, summary) {
      if (err) { return next(err); }
      if (!summary) {
        console.log(summaries[i]);
        var daySummary = new MovesDaySummary(summaries[i]);
        daySummary.save(function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log('movesSummary: ' + daySummary.date + " saved.");
          }
        });
      } else {
        summary.update(summaries[i]);
        console.log('movesSummary: ' + summary.date + " updated.");
      }
    });
  }
  var movesLog = new MovesLog({
    apiEndpoint: "/user/summary/daily?pastDays=3",
    numOfRecords: summaries.length
  });
  movesLog.save(function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log('movesLog: ' + movesLog.apiEndpoint + " saved.");
    }
  });
}

function getMovesDailySummary(username, next) {
  MovesUser.findOne({ userId: username }, function(err, movesUser) {
    moves.get(
      "/user/summary/daily?pastDays=14",
      movesUser.accessToken,
      function(error, response, body) { return next(JSON.parse(body)); }
    );
  });
}


kue.app.listen(3000);
