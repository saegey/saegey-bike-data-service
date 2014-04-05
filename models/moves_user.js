var mongoose = require('mongoose');
var movesUserSchema = mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true, unique: true },
  refreshToken: { type: String, required: true, unique: true }
});
var MovesUser = mongoose.model('MovesUser', movesUserSchema);
module.exports = MovesUser;
