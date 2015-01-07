var InstagramPhoto = require('../models/instagram_photo'),
  ModelHelper = require('../lib/model_helper');

exports.user = function (req, res) {
  var filter = { 'user.username': process.env.INSTAGRAM_USERNAME };
  ModelHelper.paginate(InstagramPhoto, filter, req, function (formattedResult) {
    res.json(formattedResult);
  }, 'created_time');
};

exports.liked = function (req, res) {
  var filter = { 'user.username': { $ne: process.env.INSTAGRAM_USERNAME } };
  ModelHelper.paginate(InstagramPhoto, filter, req, function (formattedResult) {
    res.json(formattedResult);
  }, 'created_time');
};

exports.tagged = function (req, res) {
  var filter = {
    "tags": {
      '$regex' : '.*' + req.params.tag + '.*'
    },
    "user.username": process.env.INSTAGRAM_USERNAME
  };
  ModelHelper.paginate(InstagramPhoto, filter, req, function (formattedResult) {
    res.json(formattedResult);
  });
};
