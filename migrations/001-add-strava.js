var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL);

var db = mongoose.connection,
    MovesStoryline = require('../models/moves_storyline');

MovesStoryline.find({}).exec(function (err, storylines) {
  	if (err) { throw err; }
  	storylines.forEach(function (storyline) {
  		console.log(storyline.date);
  		storyline.segments.forEach(function (segment) {
  			console.log(segment.type);
  			segment.activities.forEach(function (activity) {
  				console.log(activity.activity);
  				if (activity.activity === 'cycling') {
  					console.log("Found" + storyline._id);
  					MovesStoryline.update({_id: storyline._id}, {includesCycling: true}, {}, function (err, numberAffected, raw) {
					  if (err) return handleError(err);
					});
  				}
  			});
  		});
  	});
});