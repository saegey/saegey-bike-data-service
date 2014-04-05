var mongoose = require('mongoose');
var movesLogSchema = mongoose.Schema({
  apiEndpoint: { type: String, required: true },
  numOfRecords: { type: Number, required: true },
  updated: { type: Date, default: Date.now }
});
var MovesLog = mongoose.model('movesLog', movesLogSchema);
module.exports = MovesLog;
