/*jslint node: true */
/*jslin nomen: true */
'use strict';

var moment = require('moment'),
    _ = require("underscore");

var MovesDaySummary = require('../models/moves_day_summary'),
    MovesDailyPlace = require('../models/moves_daily_place'),
    MovesUserApiService = require('./moves_user_api_service'),
    MovesStoryline = require('../models/moves_storyline');

Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

function MovesDataStorageService(accessToken) {
    this.accessToken = accessToken;
    var apiService = new MovesUserApiService(accessToken);
    this.apiService = apiService;
}

MovesDataStorageService.prototype.syncDailySummary = function () {
    this.apiService.dailySummary(function (results) {
        _.each(results, function (summary) {
            // Use UTC function that is below
            summary.date = new Date(moment(summary.date, "YYYYMMDD").format());
            if (summary.lastUpdate !== 'undefined') {
                summary.lastUpdate = summary.lastUpdate.slice(
                    0,
                    summary.lastUpdate.length - 1
                );
                console.log(summary.lastUpdate);
                summary.lastUpdate = new Date(
                    moment(summary.lastUpdate, "YYYYMMDDTHHmmss").format()
                );
            } else {
                delete summary.lastUpdate;
            }
            MovesDataStorageService.save(summary, MovesDaySummary);
        });
    });
};

MovesDataStorageService.prototype.syncDailyPlaces = function () {
    this.apiService.dailyPlaces(function (results) {
        _.each(results, function (result) {
            result.date = new Date(moment(result.date, "YYYYMMDD").format());
            result.lastUpdate = MovesDataStorageService._convert_utc_to_date(
                result.lastUpdate
            );
            _.each(result.segments, function (segment, index) {
                segment.startTime = moment(segment.startTime, "YYYYMMDDTHHmmssZ");
                segment.endTime = moment(segment.endTime, "YYYYMMDDTHHmmssZ");
                // 20140506T171207Z
                segment.lastUpdate = MovesDataStorageService._convert_utc_to_date(
                    segment.lastUpdate
                );
                result.segments[index] = segment;
            });
            MovesDataStorageService.save(result, MovesDailyPlace);
        });
    });
};

MovesDataStorageService.prototype.syncStoryline = function() {
    this.apiService.storyline(function (results) {
        for (var i = 0; i < results.length; ++i) {
            var result = results[i];
            result.date = new Date(moment(result.date, "YYYYMMDD").format());
            var segments = result.segments;
            result.lastUpdate = MovesDataStorageService._convert_utc_to_date(
                result.lastUpdate.toString()
            );


            for (var j = 0; j < segments.length; ++j) {
                if (segments[j].type == 'move') {
                    // console.log(segments[j]);
                    result.segments[j].startTime = moment(
                        result.segments[j].startTime, "YYYYMMDDTHHmmssZ"
                    );
                    result.segments[j].endTime = moment(
                        result.segments[j].endTime, "YYYYMMDDTHHmmssZ"
                    );
                    result.segments[j].lastUpdate = MovesDataStorageService._convert_utc_to_date(
                        result.segments[j].lastUpdate
                    );
                    if (typeof segments[j].activities === 'undefined') {
                        segments[j].activities = [];
                    }
                    for (var k = 0; k < segments[j].activities.length; ++k) {
                        result.segments[j].activities[k].startTime = moment(
                            result.segments[j].activities[k].startTime, "YYYYMMDDTHHmmssZ"
                        );
                        result.segments[j].activities[k].endTime = moment(
                            result.segments[j].activities[k].endTime, "YYYYMMDDTHHmmssZ"
                        );
                    }
                    console.log(result);
                    
                } else {
                    delete result.segments[j];
                }
                MovesDataStorageService.save(result, MovesStoryline);
            }
        }
    });
};

MovesDataStorageService._convert_utc_to_date = function(currentDate) {
    var newDate = currentDate.slice(0, currentDate.length - 1);
    return new Date(moment(newDate, "YYYYMMDDTHHmmss").utc());
};

MovesDataStorageService.save = function (summary, Model) {
    Model.findOneAndUpdate({date: summary.date}, summary, ['upsert'], function(err, result) {
        if (err) { throw err; }
        if (!result) {
            var record = new Model(summary);
            record.save(function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log('Created: [' + Model.modelName + "]: " + moment(record.date).format('MM-DD-YYYY'));
                }
            });
        } else {
            console.log('Updated [' + Model.modelName + "]: " + moment(result.date).format('MM-DD-YYYY'));
        }
    });
};

module.exports = MovesDataStorageService;