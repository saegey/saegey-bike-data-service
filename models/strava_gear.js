var mongoose = require('mongoose'),
  moment = require('moment');

var stravaGearSchema = mongoose.Schema({
  id: { type: String, unique: true },
  primary: Boolean,
  name: String,
  resource_state: Number,
  distance: Number,
  brand_name: String,
  model_name: String,
  frame_type: Number,
  description: String
});

var StravaGear = mongoose.model('StravaGear', stravaGearSchema);

module.exports = StravaGear;
