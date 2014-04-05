var mongoose = require('mongoose');

var activitySchema = mongoose.Schema({
  activity: String,
  group: String,
  distance: Number,
  duration: Number,
  calories: Number
});

activitySchema.virtual('durationMinutes').get(function () {
  return ~~(this.duration / 60);
});

activitySchema.virtual('distanceMiles').get(function () {
  return (this.distance * 0.000621371).toPrecision(3);
});

var movesDaySummarySchema = mongoose.Schema({
  date:  { type: Date, unique: true, required: true },
  summary: [activitySchema]
  // lastUpdate: { type: Date, required: true }
});

var MovesDaySummary = mongoose.model('MovesDaySummary', movesDaySummarySchema);
module.exports = MovesDaySummary;
