/*jslint node: true */
/*jslin nomen: true */
'use strict';

var moment = require("moment");
var builder = require('xmlbuilder');
function p(thing) {
    return moment(thing).utc().format("YYYY-MM-DDTHH:mm:ss");
}

var createGPX = function (storyline, callback) {
    if (!storyline) {
        return callback(new Error("Empty input"));
    }
    var obj = {
        gpx: {
            "@creator": "strava.com iPhone",
            "@version": "1.1",
            "@xmlns": "http://www.topografix.com/GPX/1/1",
            "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
            "@xsi:schemaLocation": "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd",
            trk: {
                "#list": []
            }
        }
    };
    if (storyline.segments) {
        storyline.segments.forEach(function (segment) {
            if (segment.activities) {
                var seg = {
                    trkseg: {
                        "#list": []
                    }
                };
                segment.activities.forEach(function (activity) {
                    if (activity.activity === "cycling") {
                        activity.trackPoints.forEach(function (tp) {
                            var point = {
                                trkpt: {
                                    "@lat": tp.lat.toPrecision(10).toString(),
                                    "@lon": tp.lon.toPrecision(10).toString(),
                                    time: { "#text": p(tp.time) + "Z" }
                                }
                            };
                            seg.trkseg["#list"].push(point);
                        });
                    }
                });
                if (seg.trkseg["#list"].length > 0) {
                    obj.gpx.trk["#list"].push(seg);
                }
            }
        });
    }
    if (obj.gpx.trk["#list"].length > 0) {
        callback(null, builder.create(obj).end({ pretty: true, indent: '  ', newline: '\n' }));
    } else {
        callback(new Error("No cycling segments"));
    }
};
module.exports.createGPX = createGPX;