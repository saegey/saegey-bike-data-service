var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

// User Schema
var userSchema = mongoose.Schema({
  login: { type: String },
  githubId: { type: Number },
  displayName: { type: String}
});

// Bcrypt middleware
// userSchema.pre('save', function(next) {
//   var user = this;

//   if (!user.isModified('password')) {
//     return next();
//   }

//   bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
//     if(err) return next(err);

//     bcrypt.hash(user.password, salt, function(err, hash) {
//       if(err) return next(err);
//       user.password = hash;
//       next();
//     });
//   });
// });

// Password verification
// userSchema.methods.comparePassword = function(candidatePassword, cb) {
//   bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
//     if(err) return cb(err);
//     cb(null, isMatch);
//   });
// };

User = mongoose.model('user', userSchema);
module.exports = User;
