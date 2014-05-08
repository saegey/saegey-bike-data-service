var mongoose = require('mongoose');

// User Schema
var userSchema = mongoose.Schema({
  login: { type: String },
  githubId: { type: Number },
  displayName: { type: String}
});

var User = mongoose.model('user', userSchema);
module.exports = User;
