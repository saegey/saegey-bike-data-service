var csv = require('csv'),
  request = require('request'),
  _ = require('underscore');

function GoogleSheetService(url) {
  this.url = url;
}

GoogleSheetService.buildData = function (rows) {
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

GoogleSheetService.prototype.getData = function (callback) {
  request(this.url, function (err, resp, body) {
    csv.parse(body, function (err, output) {
      if (err) { console.log(err); }
      return callback(GoogleSheetService.buildData(output));
    });
  });
}

module.exports = GoogleSheetService;
