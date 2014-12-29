var _ = require('underscore'),
  StravaGear = require('../models/strava_gear'),
  StravaActivity = require('../models/strava_activity'),
  InstagramPhoto = require('../models/instagram_photo'),
  GoogleSheetService = require('../services/google_sheet_service');

function BikeDataService() {}

BikeDataService.sumField = function (fields, fieldName) {
  var sum = 0;
  _.map(fields, function (field) {
    if (field[fieldName]) {
      sum += Number(field[fieldName].replace(/[^0-9\.]+/g, ""));
    }
  });
  return sum.toFixed(2);
};

BikeDataService.findByBikeName = function (bikeName, groupBy, callback) {
  var url = process.env.GOOGLE_DOC_COMPONENTS;
  var bikeParts, total_price, photos;

  var sheetService = new GoogleSheetService(process.env.GOOGLE_DOC_COMPONENTS);
  sheetService.getData(function (result) {
      bikeParts = result.filter(function (obj) {
        if (obj.bike_name === bikeName) {
          return obj;
        }
      });
      total_price = BikeDataService.sumField(bikeParts, "cost");
      weight = BikeDataService.sumField(bikeParts, "weight");

      if (groupBy) {
        bikeParts = _.groupBy(bikeParts, function(part) {
          return part[groupBy];
        });
      }

      var cleaned_parts = [];
      _.map(bikeParts, function(num, key) {
        cleaned_parts.push({
          group: key,
          cost: BikeDataService.sumField(bikeParts[key], "cost"),
          weight: BikeDataService.sumField(bikeParts[key], "weight"),
          parts: bikeParts[key]
        });
      });

      InstagramPhoto.findByTag(bikeName, function(err, photos) {
        if (err) { throw err; }
        return callback({
          "weight": weight,
          "total_price": "$" + total_price,
          "bike_name": bikeName,
          "components": cleaned_parts,
          "photos": photos
        });
      });
  });
};

BikeDataService.getAllComponents = function (url, callback) {
  var sheetService = new GoogleSheetService(url);
  sheetService.getData(function (results) {
    return callback(results);
  });
};

BikeDataService.getSpending = function (url, callback) {
  function pad(n){
    return n.length < 2 ? '0'+ n : n
  }
  var currentDate = new Date();
  var currentSortDate = Number(
    currentDate.getFullYear().toString() + pad(currentDate.getMonth().toString())
  );
  var oldestSortDate = currentSortDate;

  BikeDataService.getAllComponents(url, function(results) {
    results.forEach(function (result) {
      if (result.purchase_date) {
        date_array = result.purchase_date.split("/");
        result.sort_date = Number(date_array[2] + pad(date_array[0]));
      } else {
        result.sort_date = "";
      }
    });

    // sort by date - ascending
    results = _.sortBy(results, function (r){
      return r.sort_date;
    });


    // get rid of results without a purchase_date and sort_date
    results = _.reject(results, function (r) {
      return r.sort_date === "";
    });

    var highDate = results[results.length - 1].sort_date;
    var lowDate = results[0].sort_date;
    console.log(lowDate);

    // group from collection into set by sort_date
    results = _.groupBy(results, function (r) {
      return r.sort_date;
    });

    var spending = [];
    for(var lowDate; lowDate <= highDate; lowDate++ ) {
      spending.push({
        "date": new String(lowDate),
        "total_spend": BikeDataService.sumField(results[lowDate], 'cost'),
        "components": results[lowDate]
      });
      strLowDate = new String(lowDate);
      console.log(strLowDate.substr(strLowDate.length - 2, strLowDate.length - 1));
      if (strLowDate.substr(strLowDate.length - 2, strLowDate.length - 1) === "12") {
        lowDate = lowDate + 88;
        // console.log(lowDate);
      }
    }

    return callback(spending);
  });
};

BikeDataService.getAllBikes = function (url, callback) {
  var sheetService = new GoogleSheetService(url);
  sheetService.getData(function (results) {
    results.forEach(function (bike) {
      bike.instagram_tags = bike.instagram_tags.split(",");
    });
    return callback(results);
  });
};

module.exports = BikeDataService;
