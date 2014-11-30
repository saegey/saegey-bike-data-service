/*jslint node: true */
/*jslint nomen: true */
'use strict';

var ig = require('instagram-node').instagram();
var InstagramPhoto = require('../models/instagram_photo');
ig.use({ access_token: process.env.INSTAGRAM_ACCESS_TOKEN });

function InstagramDataStorageService() {}

InstagramDataStorageService.prototype.syncLikedPhotos = function () {
    ig.user_self_liked([], InstagramDataStorageService.savePhotos);
};

InstagramDataStorageService.prototype.syncUserPhotos = function () {
    ig.user_self_media_recent([], InstagramDataStorageService.savePhotos);
};

InstagramDataStorageService.savePhotos = function (err, medias, pagination, limit) {
    if (err) { throw err; }
    medias.forEach(function (m) {
        InstagramPhoto.findOneAndUpdate({id: m.id}, m, ['upsert'], function(err, result) {
            if (err) { throw err; }
            if (!result) {
                var record = new InstagramPhoto(m);
                record.created_time = new Date(record.created_time * 1000);
                record.save(function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log('Created: [InstagramPhoto]: ' + record.created_time);
                    }
                });
            } else {
                result.created_time = new Date(result.created_time * 1000);
                result.save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                });
            }
        });
    });
    if(pagination.next) {
        pagination.next(InstagramDataStorageService.savePhotos); // Will get second page results
    }
}

module.exports = InstagramDataStorageService;