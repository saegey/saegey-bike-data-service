var _ = require('underscore'),
  StravaGear = require('../models/strava_gear'),
  StravaActivity = require('../models/strava_activity'),
  InstagramPhoto = require('../models/instagram_photo'),
  ModelHelper = require('../lib/model_helper'),
  GoogleSheetService = require('../services/google_sheet_service');

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

function BikeDataService() {}

BikeDataService.groupByCol = function (array, f) {
  var groups = {};
  array.forEach(function (o) {
    var group = JSON.stringify(f(o));
    groups[group] = groups[group] || [];
    groups[group].push(o);
  });
  return Object.keys(groups).map(function (group) {
    return groups[group];
  });
};

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
  var bikeParts, total_price;

  var sheetService = new GoogleSheetService(process.env.GOOGLE_DOC_COMPONENTS);
  sheetService.getData(function (result) {
      bikeParts = result.filter(function (obj) {
        if (obj.bike_name === bikeName) {
          return obj;
        }
      });
      total_price = BikeDataService.sumField(bikeParts, "cost");

      if (groupBy) {
        bikeParts = BikeDataService.groupByCol(bikeParts, function (item) {
          return [item[groupBy]];
        });
      }

      if (bikeParts.length > 0) {
        return callback({
          "total_price": "$" + total_price,
          "bike_name": bikeName,
          "components": bikeParts
        });
      } else {
        return callback();
      }
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
