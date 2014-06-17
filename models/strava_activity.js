/*jslint node: true */
/*jslin nomen: true */
'use strict';

var mongoose = require('mongoose');
var moment = require('moment');

var stravaActivitySchema = mongoose.Schema({
    id: Number,
    resource_state: Number,
    external_id: String,
    upload_id: Number,
    athlete: {
        id: Number,
        resource_state: Number
    },
    name: String,
    distance: Number,
    moving_time: Number,
    elapsed_time: Number,
    total_elevation_gain: Number,
    type: String,
    start_date: Date,
    start_date_local: Date,
    timezone: String,
    start_latlng: [Number],
    end_latlng: [Number],
    location_city: String,
    location_state: String,
    location_country: String,
    start_latitude: Number,
    start_longitude: Number,
    achievement_count: Number,
    kudos_count: Number,
    comment_count: Number,
    athlete_count: Number,
    photo_count: Number,
    map: {
        id: String,
        summary_polyline: String,
        resource_state: Number
    },
    trainer: Boolean,
    commute: Boolean,
    manual: Boolean,
    private: Boolean,
    flagged: Boolean,
    gear_id: String,
    average_speed: Number,
    max_speed: Number,
    average_watts: Number,
    kilojoules: Number,
    has_kudoed: Boolean
});

stravaActivitySchema.plugin(require('mongoose-paginate'));
var StravaActivity = mongoose.model('StravaActivity', stravaActivitySchema);

module.exports = StravaActivity;
