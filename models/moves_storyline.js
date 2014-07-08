/*jslint node: true */
/*jslin nomen: true */
'use strict';

var mongoose = require('mongoose');
var moment = require('moment');

var trackPointSchema = mongoose.Schema({
    lat: { type: Number},
    lon: { type: Number },
    time: { type: Date}
});

var activitySchema = mongoose.Schema({
    activity: String,
    group: String,
    startTime: Date,
    endTime: Date,
    distance: Number,
    duration: Number,
    calories: Number,
    steps: Number,
    stravaId: { type: String },
    trackPoints: [trackPointSchema]
});

var moveSchema = mongoose.Schema({
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    lastUpdate: { type: Date, required: true},
    type: { type: String },
    activities: [activitySchema]
});


var movesStorylineSchema = mongoose.Schema({
    date: { type: Date, required: true},
    segments: [moveSchema],
    lastUpdate: { type: Date },
    includesCycling: { type: Boolean }
});

movesStorylineSchema.statics.findByActivityIds = function (parentIds, activityIds, callback) {
    this.find({}).where('_id').in(parentIds).exec(function (err, results) {
        var activities = [];
        results.forEach(function (result) {
            result.segments.forEach(function (segment) {
                segment.activities.forEach(function (activity) {
                    activityIds.forEach(function (a) {
                        if (a === activity._id.toString()) {
                            activities.push(activity);
                        }
                    });
                });
            });
        });
        return callback(err, activities, results);
    });  
}

movesStorylineSchema.statics.updateStravaId = function (results, activityIds, stravaId, callback) {
    var activities = [];
    results.forEach(function (result, resultKey) {
        result.segments.forEach(function (segment, segmentKey) {
            segment.activities.forEach(function (activity, activityKey) {
                activityIds.forEach(function (a) {
                    if (a === activity._id.toString()) {
                        result.segments[segmentKey].activities[activityKey].stravaId = stravaId;
                        result.save(function(err) {
                            if (err) { throw err; }
                        });
                        activities.push(result.segments[segmentKey].activities[activityKey]);
                    }
                });
            });
        });
    });
    return callback(activities); 
}


movesStorylineSchema.plugin(require('mongoose-paginate'));
var MovesStoryline = mongoose.model('MovesStoryline', movesStorylineSchema);

module.exports = MovesStoryline;