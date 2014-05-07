var Moves = require("moves");
var MovesUser = require('../models/moves_user');
var MovesDaySummary = require('../models/moves_day_summary');
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
  MovesDaySummary.find().sort('-lastUpdate').exec(function(err, summary) {
    console.log(summary);
    var url = "/user/summary/daily?pastDays=14";
    if (summary.length > 0) {
       url += "updatedSince=";
       url += moment(summary[0].lastUpdate).utc().format('YYYYMMDDTHHmmss') + "Z";
    }
    console.log(url);
    MovesUserApiService.movesApi(username, url, next);
  });
}

MovesUserApiService.prototype.dailyPlaces = function(next) {
  var url = "/user/places/daily?pastDays=14"
  MovesUserApiService.movesApi(this.username, url, next);
}

MovesUserApiService.movesApi = function(username, url, next) {
  MovesUser.findOne({ userId: username }, function(err, movesUser) {
    moves.get(url, movesUser.accessToken, function(error, response, body) {
      if(error) {
        console.log('error ' + error);
        throw error;
      }
      console.log(JSON.parse(body));
      return next(JSON.parse(body, error));
    });
  });
}

// MovesUserApiService.lastUpdate = function(entity) {
//   var lastUpdate = {};
//   switch(entity) {
//     case 'dailySummary':
//       lastUpdate
//   }
// }

module.exports = MovesUserApiService;