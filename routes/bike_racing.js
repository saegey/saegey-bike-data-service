var redis = require('redis-url').connect(process.env.REDISTOGO_URL);

redis.on("error", function (err) {
  console.log("Error " + err);
});

exports.index = function (req, res) {
  redis.get('race_results', function(err, results) {
    res.json(JSON.parse(results));
  });
};
