/*jslint node: true */
/*jslin nomen: true */
'use strict';

var ig = require('instagram-node').instagram(),
    redirect_uri = process.env.INSTAGRAM_REDIRECT_URI,
    InstagramPhoto = require('../models/instagram_photo'),
    paginate = require('express-paginate');

ig.use({
    client_id: process.env.INSTAGRAM_CLIENT_ID,
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET
});

function instagramPaginate(filter, req, next) {
    InstagramPhoto.paginate(filter, req.query.page, req.query.limit, function(err, pageCount, photos, itemCount) {
        if (err) return next(err)
        next({
            object: 'list',
            has_more: paginate.hasNextPages(req)(pageCount),
            data: photos
        })
    }, { sortBy : { created_time : -1 } });
}

exports.userPhotos = function (req, res) {
    var filter = { 'user.username': process.env.INSTAGRAM_USERNAME }
    instagramPaginate(filter, req, function(formattedResult) {
        res.format({
          json: function() {
            res.json(formattedResult);
          }
        });
    });
};

exports.likedPhotos = function (req, res) {
    var filter = { 'user.username': { $ne: process.env.INSTAGRAM_USERNAME } }
    instagramPaginate(filter, req, function(formattedResult) {
        res.format({
          json: function() {
            res.json(formattedResult);
          }
        });
    });
};

exports.taggedPhotos = function (req, res) {
    var filter = {
        "tags": {
            '$regex' : '.*' + req.params["tag"] + '.*'
        },
        "user.username": process.env.INSTAGRAM_USERNAME
    };
    InstagramPhoto.find(filter).sort('-created_time').exec(function (err, photos) {
        if (err) { throw err; }
        res.format({
            json: function() {
                res.json(photos);
            }
        });
    });
};