/*jslint node: true */
/*jslin nomen: true */
'use strict';

var mongoose = require('mongoose');
var moment = require('moment');

var movesSegmentSchema = mongoose.Schema({
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    lastUpdate: { type: Date, required: true},
    place: {
        id: { type: Number },
        name: { type: String },
        foursquareId: { type: String },
        foursquareCategoryIds: [String],
        location: {
            lat: { type: Number },
            lon: { type: Number }
        }
    }
});

movesSegmentSchema.virtual('totalTime').get(function () {
    return moment(this.endTime).diff(this.startTime, 'minutes');
});

var movesDailyPlaceSchema = mongoose.Schema({
    date: { type: Date, required: true},
    segments: [ movesSegmentSchema ],
    lastUpdate: { type: Date }
});

var movesDailyPlace = mongoose.model('PlaceVisit', movesDailyPlaceSchema);
module.exports = movesDailyPlace;