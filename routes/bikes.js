var StravaGear = require('../models/strava_gear'),
  StravaActivity = require('../models/strava_activity'),
  InstagramPhoto = require('../models/instagram_photo'),
  ModelHelper = require('../lib/model_helper'),
  BikeDataService = require('../services/bike_data_service');

exports.index = function (req, res) {
  BikeDataService.findAll(process.env.GOOGLE_DOC_BIKES, function(data) {
    return res.json(data);
  });
};

exports.rides = function (req, res) {
  BikeDataService.findAll(process.env.GOOGLE_DOC_BIKES, function(data) {
    data.filter(function (bike) {
      if (bike.bike_name === req.params.bike) {
        StravaGear.findOne({ name: bike.strava_name }, function (err, bike) {
          if (err) { throw err; }
          if (bike) {
            var filter = { 'gear_id': bike.id };
            ModelHelper.paginate(StravaActivity, filter, req, function (formattedResult) {
                res.json(formattedResult);
            }, 'start_date');
          } else {
            res.status(404).send('Not found'); 
          }
        });
      }
    });
  });
};

exports.show = function (req, res) {
  if (!req.params.bike) {
    res.status(404).send('Not found');
  }
  BikeDataService.findByBikeName(
    req.params.bike,
    req.query.group_by, 
    function(data) {
      return res.json(data);
    }
  );
};
