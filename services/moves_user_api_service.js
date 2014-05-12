/*jslint node: true */
/*jslin nomen: true */
'use strict';

var moment = require('moment');
var Moves = require("moves");
var moves = new Moves({
    api_base: "https://api.moves-app.com/api/1.1",
    client_id: process.env.MOVES_CLIENT_ID,
    client_secret: process.env.MOVES_CLIENT_SECRET,
    redirect_uri: process.env.MOVES_REDIRECT_URI
});

var MovesUser = require('../models/moves_user');
var MovesDaySummary = require('../models/moves_day_summary');
var MovesDailyPlace = require('../models/moves_daily_place');
var MovesStoryline = require('../models/moves_storyline');

function MovesUserApiService(username) {
    this.username = username;
}

MovesUserApiService.prototype.dailySummary = function (next) {
    MovesUserApiService.movesGetNewData(
        MovesDaySummary,
        'summary',
        this.username,
        next
    );
};

MovesUserApiService.prototype.dailyPlaces = function (next) {
    MovesUserApiService.movesGetNewData(
        MovesDailyPlace,
        'places',
        this.username,
        next
    );
};

MovesUserApiService.prototype.storyline = function (next) {
    MovesUserApiService.movesGetNewData(
        MovesStoryline,
        'storyline',
        this.username,
        next
    );
};

MovesUserApiService.movesGetNewData = function (model, entity, username, next) {
    model.find().sort('-lastUpdate').exec(function (err, results) {
        var url = "";
        if (entity === 'storyline') {
            url = MovesUserApiService.buildApiUrl(entity, results, true, 7);
        } else {
            url = MovesUserApiService.buildApiUrl(entity, results);
        }
        MovesUserApiService.movesApi(username, url, next);
    });
};

MovesUserApiService.movesApi = function (username, url, next) {
    MovesUser.findOne({ userId: username }, function (err, movesUser) {
        console.log('Retrieving: ' + url);
        moves.get(url, movesUser.accessToken, function (error, response, body) {
            if (error) {
                console.log('error ' + error);
                throw error;
            }
            console.log("# Results: " + JSON.parse(body).length);
            return next(JSON.parse(body, error));
        });
    });
};

MovesUserApiService.buildApiUrl = function (entity, results, trackPoints, pastDays) {
    var url = "/user/" + entity + "/daily?";
    if (pastDays !== "undefined") {
        url += "pastDays=" + pastDays;
    } else {
        url += "pastDays=14";
    }
    if (results.length > 0) {
        url += "&updatedSince=";
        url += moment(results[0].lastUpdate).format('YYYYMMDDTHHmmss') + "Z";
    }
    if (trackPoints !== "undefined") { url += "&trackPoints=true"; }
    return url;
};

module.exports = MovesUserApiService;