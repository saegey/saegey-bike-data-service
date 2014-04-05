exports.authorize = function(moves) {
  return function(req, res) {
    moves.authorize({
        scope: ['activity']
      , state: '123'
    }, res);
  }
};
exports.token = function(moves, MovesUser) {
  return function(req, res) {
    moves.token(req.query.code, function(error, response, body) {
      body = JSON.parse(body)

      var movesUser = new MovesUser({
        userId: 'adams',
        refreshToken: body.refresh_token,
        accessToken: body.access_token
      });

      movesUser.save(function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log('movesUser: ' + movesUser.accessToken + " saved.");
          res.redirect("/");
        }
      });
    });
  }
};
