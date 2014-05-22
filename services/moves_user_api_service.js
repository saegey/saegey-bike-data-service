/*jslint node: true */
/*jslin nomen: true */
'use strict';

var moment = require('moment'),
    Moves = require("moves"),
    moves = new Moves({
        api_base: "https://api.moves-app.com/api/1.1",
        client_id: process.env.MOVES_CLIENT_ID,
        client_secret: process.env.MOVES_CLIENT_SECRET,
        redirect_uri: process.env.MOVES_REDIRECT_URI
    });

var MovesDaySummary = require('../models/moves_day_summary'),
    MovesDailyPlace = require('../models/moves_daily_place'),
    MovesStoryline = require('../models/moves_storyline');

function MovesUserApiService(accessToken) {
    this.accessToken = accessToken;
}

MovesUserApiService.prototype.dailySummary = function (next) {
    MovesUserApiService.movesGetNewData(
        MovesDaySummary,
        'summary',
        this.accessToken,
        next
    );
};

MovesUserApiService.prototype.dailyPlaces = function (next) {
    MovesUserApiService.movesGetNewData(
        MovesDailyPlace,
        'places',
        this.accessToken,
        next
    );
};

MovesUserApiService.prototype.storyline = function (next) {
    MovesUserApiService.movesGetNewData(
        MovesStoryline,
        'storyline',
        this.accessToken,
        next
    );
};

MovesUserApiService.movesGetNewData = function (model, entity, accessToken, next) {
    model.find().sort('-lastUpdate').exec(function (err, results) {
        var url = "";
        if (entity === 'storyline') {
            url = MovesUserApiService.buildApiUrl(entity, results, true, 7);
        } else {
            url = MovesUserApiService.buildApiUrl(entity, results);
        }
        MovesUserApiService.movesApi(accessToken, url, next);
    });
};

MovesUserApiService.movesApi = function (accessToken, url, next) {
    console.log('Retrieving: ' + url);
    moves.get(url, accessToken, function (error, response, body) {
        if (error) {
            console.log('error ' + error);
            throw error;
        }
        return next(JSON.parse(body, error));
    });
};

MovesUserApiService.buildApiUrl = function (entity, results, trackPoints, pastDays) {
    var url = "/user/" + entity + "/daily?";
    if (pastDays) {
        url += "pastDays=" + pastDays;
    } else {
        url += "pastDays=14";
    }
    if (results.length > 0) {
        url += "&updatedSince=";
        url += moment(results[0].lastUpdate).format('YYYYMMDDTHHmmss') + "Z";
    }
    if (trackPoints) { url += "&trackPoints=true"; }
    return url;
};

module.exports = MovesUserApiService;
