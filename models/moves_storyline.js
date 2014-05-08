var mongoose = require('mongoose');
var moment = require('moment');

var trackPointSchema = mongoose.Schema({
  lat: { type: Number},
  lon: { type: Number },
  time: { type: Date}
});

var moveSchema = mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  lastUpdate: { type: Date, required: true},
  type: { type: String },
  activites: [activitySchema]
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
  trackPoints: [trackPointSchema]
});


var movesStorylineSchema = mongoose.Schema({
  date: { type: Date, required: true},
  segments: [moveSchema],
  lastUpdate: { type: Date }
});

var MovesStoryline = mongoose.model('MovesStoryline', movesStorylineSchema);
module.exports = MovesStoryline;