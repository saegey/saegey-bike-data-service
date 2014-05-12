/*jslint node: true */
/*jslint nomen: true */
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
        _.each(results, function (result) {
            // Use UTC function that is below
            result.date = new Date(moment(result.date, "YYYYMMDD").format());
            result.lastUpdate = MovesDataStorageService._convert_utc_to_date(
                result.lastUpdate
            );
            MovesDataStorageService.save(result, MovesDaySummary);
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

MovesDataStorageService.prototype.syncStoryline = function () {
    this.apiService.storyline(function (results) {
        _.each(results, function (result) {
            result.date = new Date(moment(result.date, "YYYYMMDD").format());
            result.lastUpdate = MovesDataStorageService._convert_utc_to_date(
                result.lastUpdate
            );
            _.each(result.segments, function (segment, segmentIndex) {
                if (segment.type === 'move') {
                    segment.startTime = moment(
                        segment.startTime,
                        "YYYYMMDDTHHmmssZ"
                    );
                    segment.endTime = moment(
                        segment.endTime,
                        "YYYYMMDDTHHmmssZ"
                    );
                    segment.lastUpdate = MovesDataStorageService._convert_utc_to_date(
                        segment.lastUpdate
                    );
                    _.each(segment.activities, function (activity, activityIndex) {
                        activity.startTime = moment(
                            activity.startTime,
                            "YYYYMMDDTHHmmssZ"
                        );
                        activity.endTime = moment(
                            activity.endTime,
                            "YYYYMMDDTHHmmssZ"
                        );
                        if (activity.trackPoints) {
                            _.each(activity.trackPoints, function (trackPoint, trackPointIndex) {
                                activity.trackPoints[trackPointIndex].time = moment(
                                    trackPoint.time,
                                    "YYYYMMDDTHHmmssZ"
                                );
                            });
                        }
                        segment.activities[activityIndex] = activity;
                    });
                    result.segments[segmentIndex] = segment;
                } else {
                    delete result.segments[segmentIndex];
                }
            });
            // clean blank elements that were remove that werent type "move"
            // this done to not screw up the index in the each loop
            result.segments = result.segments.filter(function (n) {
                return n !== undefined;
            });
            MovesDataStorageService.save(result, MovesStoryline);
        });
    });
};

MovesDataStorageService._convert_utc_to_date = function (currentDate) {
    if (currentDate && currentDate.length) {
        var newDate = currentDate.slice(0, currentDate.length - 1);
        return new Date(moment(newDate, "YYYYMMDDTHHmmss").utc());
    } else {
        return Date.now();
    }
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