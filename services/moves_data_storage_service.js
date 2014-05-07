var moment = require('moment');

var MovesDaySummary = require('../models/moves_day_summary');
var MovesDailyPlace = require('../models/moves_daily_place');
var MovesUserApiService = require('./moves_user_api_service');

function MovesDataStorageService(username) {
  this.username = username;
  var apiService = new MovesUserApiService(username);
  this.apiService = apiService;
}

MovesDataStorageService.prototype.syncDailySummary = function() {
  this.apiService.dailySummary(function(results) {
    for (i = 0; i < results.length; ++i) {
      MovesDataStorageService.saveSummary(results[i]);
    }
  });
}

MovesDataStorageService.prototype.syncDailyPlaces = function() {
  this.apiService.dailyPlaces(function(results) {
    for (i = 0; i < results.length; ++i) {
      results[i].date = new Date(moment(results[i].date, "YYYYMMDD").format());
      for (j = 0; j < results[i].segments.length; ++j) {
        // 20121212T000000+0200
        var segment = results[i].segments[j];
        segment.startTime = moment(segment.startTime, "YYYYMMDDTHHmmssZ");
        segment.endTime = moment(segment.endTime, "YYYYMMDDTHHmmssZ");
        // 20140506T171207Z
        segment.lastUpdate = segment.lastUpdate.slice(0, segment.lastUpdate.length - 1)
        segment.lastUpdate = moment(segment.lastUpdate, "YYYYMMDDTHHmmss");
        results[i].segments[j] = segment;
      }
      MovesDataStorageService.savePlace(results[i]);
    }
  });
}

MovesDataStorageService.saveSummary = function(summary) {
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
      var daySummary = new MovesDaySummary(summary);
      daySummary.save(function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log('Created: ' + moment(daySummary.date).format('MM-DD-YYYY'));
        }
      });
    } else {
      console.log("Updated:" + moment(result.date).format('MM-DD-YYYY'));
    }
  });
}

MovesDataStorageService.savePlace = function(summary) {
  MovesDailyPlace.findOneAndUpdate({date: summary.date }, summary, ['upsert'], function(err, result) {
    if (err) { throw err; }
    if (!result) {
      var daySummary = new MovesDailyPlace(summary);
      daySummary.save(function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log('Created: ' + moment(daySummary.date).format('MM-DD-YYYY'));
        }
      });
    } else {
      console.log("Updated:" + moment(result.date).format('MM-DD-YYYY'));
    }
  });
}

module.exports = MovesDataStorageService;