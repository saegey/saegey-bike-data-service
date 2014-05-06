var mongoose = require('mongoose');
var placeSchema = mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String },
  foursquareId: { type: String },
  foursquareCategoryIds: [String],
  location: {
    lat: { type: Number },
    lon: { type: Number }
  }
});
var Place = mongoose.model('Place', placeSchema);
module.exports = Place;