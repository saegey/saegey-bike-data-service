var csv = require('csv'),
    request = require('request'),
    _ = require('underscore');

var bikes = [
    {
        "id": "1", 
        "name": "Crosscheck",
        "tag": "crosscheck",
        "docKey": "0AmHVoD078iZkdEgwUDR5UE9PVHU4TVAzanFqTnAtb3c&gid=0"
    },
    {
        "id": "2", 
        "name": "Juice 29er", 
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
    for(var i=1; i < rows.length; i++) {
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

exports.index = function (req, res) {
    res.json(bikes);
}

exports.show = function (req, res) {
    var foundBike = _.find(bikes, function(bike){ 
        return bike.tag == req.params.tag;
    });
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

                res.json({
                    summary: {
                        total_cost: "$" + sumField(bikeParts, 'cost'),
                        total_weight: sumField(bikeParts, 'weight')
                    },
                    details: bikeGroups || bikeParts
                });
            });
        });
    }
};