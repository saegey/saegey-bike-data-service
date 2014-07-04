var csv = require('csv'),
    request = require('request'),
    _ = require('underscore'),
    StravaGear = require('../models/strava_gear'),
    StravaActivity = require('../models/strava_activity'),
    InstagramPhoto = require('../models/instagram_photo'),
    ModelHelper = require('../lib/model_helper');

var bikes = [
    {
        "id": "1", 
        "name": "Surly Crosscheck",
        "tag": "crosscheck",
        "docKey": "0AmHVoD078iZkdEgwUDR5UE9PVHU4TVAzanFqTnAtb3c&gid=0"
    },
    {
        "id": "2", 
        "name": "Soma Juice",
        "tag": "juice29er",
        "docKey": "0AmHVoD078iZkdEgwUDR5UE9PVHU4TVAzanFqTnAtb3c&gid=4"
    }
];

function groupBy( array , f ) {
  var groups = {};
  array.forEach( function( o )
  {
    var group = JSON.stringify( f(o) );
    groups[group] = groups[group] || [];
    groups[group].push( o );  
  });
  return Object.keys(groups).map( function( group )
  {
    return groups[group]; 
  })
}


function buildData(rows) {
    var formattedData = [];
    for(var i = 1; i < rows.length; i++) {
        var part = {};
        for(var j=0; j < rows[0].length; j++) {
            part[rows[0][j].toLowerCase()] = rows[i][j];
        }
        formattedData.push(part);
    }
    return formattedData;
}

function sumField(fields, fieldName) {
    var sum = 0;
    _.map(fields, function(field) { 
        sum += Number(field[fieldName].replace(/[^0-9\.]+/g,"")); 
    });
    return sum.toFixed(2);
}

function buildGoogleDocUrl(docKey) {
    var docUrl = "https://docs.google.com/spreadsheet/pub?output=csv";
    docUrl += "&key=" + docKey;
    return docUrl;
}

function findBike(bikeName) {
    var foundBike = _.find(bikes, function(bike){ 
        return bike.tag == bikeName;
    });
    return foundBike;
}

exports.index = function (req, res) {
    res.json(bikes);
}

exports.rides = function (req, res) {
    var foundBike = findBike(req.params.bike);
    StravaGear.findOne({ name: foundBike.name }, function (err, bike) {
        if (err) { throw err; }
        if (bike) {
            var filter = { 'gear_id': bike.id };
            ModelHelper.paginate(StravaActivity, filter, req, function(formattedResult) {
                res.json(formattedResult);
            }, 'start_date');
        } else {
            res.status(404).send('Not found'); 
        }
    });
}

exports.show = function (req, res) {
    var foundBike = findBike(req.params.bike);
    if (!foundBike) { 
        res.status(404).send('Not found'); 
    } else {
        request(buildGoogleDocUrl(foundBike.docKey), function(err, resp, body) {
            if (err) { res.status(404).send('Not found'); }
            csv.parse(body, function(err, output) {
                if (err) { console.log(err); }
                bikeParts = buildData(output);

                if (req.query.group_by) {
                    var bikeGroups = groupBy(bikeParts, function(item) {
                        var groupBy = req.query.group_by;
                        return [item[groupBy]];
                    });
                }

                InstagramPhoto.findByTag(foundBike.tag, function(err, photos) {
                    if (err) { throw err; }
                    var returnData = {
                        summary: {
                            name: foundBike.name,
                            tag: foundBike.tag,
                            total_cost: "$" + sumField(bikeParts, 'cost'),
                            total_weight: sumField(bikeParts, 'weight')
                        },
                        details: bikeGroups || bikeParts
                    }
                    if (photos) {
                        returnData['photos'] = photos;
                    }
                    res.json(returnData);
                })
            });
        });
    }
};