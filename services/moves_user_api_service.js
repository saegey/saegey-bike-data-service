var Moves = require("moves");
var MovesUser = require('../models/moves_user');
var MovesDaySummary = require('../models/moves_day_summary');
var MovesDailyPlace = require('../models/moves_daily_place');
var moves = new Moves({
  api_base: "https://api.moves-app.com/api/1.1",
  client_id: process.env.MOVES_CLIENT_ID,
  client_secret: process.env.MOVES_CLIENT_SECRET,
  redirect_uri: process.env.MOVES_REDIRECT_URI
});
var moment = require('moment');

function MovesUserApiService(username) {
  this.username = username;
}

MovesUserApiService.prototype.dailySummary = function(next) {
  var username = this.username;
  MovesDaySummary.find().sort('-lastUpdate').exec(function(err, results) {
    var url = MovesUserApiService.buildApiUrl('summary', results);
    MovesUserApiService.movesApi(username, url, next);
  });
}

MovesUserApiService.prototype.dailyPlaces = function(next) {
  var username = this.username;
  MovesDailyPlace.find().sort('-lastUpdate').exec(function(err, results) {
    var url = MovesUserApiService.buildApiUrl('places', results);
    MovesUserApiService.movesApi(username, url, next);
  });
}

MovesUserApiService.movesApi = function(username, url, next) {
  MovesUser.findOne({ userId: username }, function(err, movesUser) {
    console.log('Retrieving: ' + url);
    moves.get(url, movesUser.accessToken, function(error, response, body) {
      if(error) {
        console.log('error ' + error);
        throw error;
      }
      console.log("# Results: " + JSON.parse(body).length);
      return next(JSON.parse(body, error));
    });
  });
}

MovesUserApiService.buildApiUrl = function(entity, results) {
  var url = "/user/" + entity + "/daily?pastDays=14";
  if (results.length > 0) {
     url += "&updatedSince=";
     url += moment(results[0].lastUpdate).format('YYYYMMDDTHHmmss') + "Z";
  }
  return url;
}

module.exports = MovesUserApiService;