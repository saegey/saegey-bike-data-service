var kue = require('kue');
var schedule = require('node-schedule');
var moment = require('moment');
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
var MovesDailyPlace = require('./models/moves_daily_place');
var MovesUserApiService = require('./services/moves_user_api_service');

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

getMovesDailySummary('adams', function(summaries) {
  updateMovesSummaries(summaries);
});

// getMovesDailyPlaces('adams', function(dailyPlaces) {
//   for (i = 0; i < dailyPlaces.length; ++i) {
//     dailyPlaces[i].date = parseMovesDate(dailyPlaces[i].date);
//     for (j = 0; j < dailyPlaces[i].segments.length; ++j) {
//       // 20121212T000000+0200
//       var segment = dailyPlaces[i].segments[j];
//       segment.startTime = moment(segment.startTime, "YYYYMMDDTHHmmssZ");
//       segment.endTime = moment(segment.endTime, "YYYYMMDDTHHmmssZ");
//       // 20140506T171207Z
//       segment.lastUpdate = segment.lastUpdate.slice(0, segment.lastUpdate.length - 1)
//       segment.lastUpdate = moment(segment.lastUpdate, "YYYYMMDDTHHmmss");
//       dailyPlaces[i].segments[j] = segment;
//     }
//     saveDailyPlace(dailyPlaces[i]);
//   }
// });

function saveDailyPlace(dailyPlace, next) {
  MovesDailyPlace.findOne(
    { date: dailyPlace.date },
    function(err, result) {
      if (err) { throw err; }
      if (!result) { 
        var place = new MovesDailyPlace(dailyPlace);
        place.save(function(err) {
          if (err) { throw err };
        });
        console.log("insert moves place " + dailyPlace.date)
      } else {
        result.update(dailyPlace);
        console.log("update moves place " + result);
      }
    }
  );
}

// jobs.process('movesDailySummary', 10, function (job, done) {
//   getMovesDailySummary(job.data.username, function(summaries) {
//     console.log(summaries);
//     updateMovesSummaries(summaries);
//   });
//   done();
// });

function saveSummary(summary) {
  summary.date = new Date(moment(summary.date, "YYYYMMDD").format());
  if (typeof summary.lastUpdate != 'undefined') {
    summary.lastUpdate = summary.lastUpdate.slice(0, summary.lastUpdate.length - 1)
    summary.lastUpdate = new Date(
      moment(summary.lastUpdate, "YYYYMMDDTHHmmss").format()
    );
  } else {
    delete summary.lastUpdate;
  }
  MovesDaySummary.findOneAndUpdate({date: summary.date }, summary, ['upsert'], function(err, result) {
    if (err) { throw err; }
    if (!result) {
      console.log("Summary not found for day");
      var daySummary = new MovesDaySummary(summary);
      daySummary.save(function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log('movesSummary: ' + daySummary.date + " saved.");
        }
      });
    } else {
      console.log("Summary updated.");
    }
  });
}

function updateMovesSummaries(summaries) {
  for (i = 0; i < summaries.length; ++i) {
    saveSummary(summaries[i]);
  }
}

function getMovesDailySummary(username, next) {
  var apiService = new MovesUserApiService(username);
  apiService.dailySummary(next);
}

function getMovesDailyPlaces(username, next) {
  var apiService = new MovesUserApiService(username);
  apiService.dailyPlaces(next);
}

kue.app.listen(3000);