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

activitySchema.virtual('friendlyDate').get(function () {
  return Date.parse(this.date.substr(4,2) + "/" +
    this.date.substr(6,2) + "/" + this.date.substr(0,4));
});

var movesDaySummarySchema = mongoose.Schema({
  date:  { type: Date },
  summary: [activitySchema],
  lastUpdate: { type: Date }
});

// movesDaySummarySchema.statics.findByName = function (name, cb) {
//   this.find({ name: new RegExp(name, 'i') }, cb);
// }

var MovesDaySummary = mongoose.model('MovesDaySummary', movesDaySummarySchema);
module.exports = MovesDaySummary;
