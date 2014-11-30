var csv = require('csv'),
  request = require('request'),
  _ = require('underscore'),
  StravaGear = require('../models/strava_gear'),
  StravaActivity = require('../models/strava_activity'),
  InstagramPhoto = require('../models/instagram_photo'),
  ModelHelper = require('../lib/model_helper');

function buildData(rows) {
  var formattedData = [];
  var i, j = 1;
  var part = {};

  for (i = 1; i < rows.length; i++) {
    part = {};
    for (j = 0; j < rows[0].length; j++) {
      if (rows[0][j]) {
        part[rows[0][j].toLowerCase()] = rows[i][j];
      }
    }
    formattedData.push(part);
  }
  return formattedData;
}

function groupByCol(array, f) {
  var groups = {};
  array.forEach(function (o) {
    var group = JSON.stringify(f(o));
    groups[group] = groups[group] || [];
    groups[group].push(o);
  });
  return Object.keys(groups).map(function (group) {
    return groups[group];
  });
}

function sumField(fields, fieldName) {
  var sum = 0;
  _.map(fields, function (field) {
    if (field[fieldName]) {
      sum += Number(field[fieldName].replace(/[^0-9\.]+/g, ""));
    }
  });
  return sum.toFixed(2);
}

function BikeDataService() {}

BikeDataService.findByBikeName = function (bikeName, groupBy, callback) {
  var url = process.env.GOOGLE_DOC_COMPONENTS;
  var bikeParts, total_price;

  request(url, function (err, resp, body) {
    csv.parse(body, function (err, output) {
      if (err) { console.log(err); }
      bikeParts = buildData(output).filter(function (obj) {
        if (obj.bike_name === bikeName) {
          return obj;
        }
      });
      total_price = sumField(bikeParts, "cost");

      if (groupBy) {
        bikeParts = groupByCol(bikeParts, function (item) {
          return [item[groupBy]];
        });
      }
      return callback({
        "total_price": "$" + total_price,
        "bike_name": bikeName,
        "components": bikeParts
      });
    });
  });
}

BikeDataService.findAll = function (url, callback) {
  var data;
  request(url, function (err, resp, body) {
    csv.parse(body, function (err, output) {
      if (err) { console.log(err); }
      data = buildData(output);
      data.forEach(function (bike) {
        bike.instagram_tags = bike.instagram_tags.split(",");
      });
      return callback(data);
    });
  });
}

module.exports = BikeDataService;