var Moves = require("moves"), 
   	moves = new Moves({
        api_base: "https://api.moves-app.com/api/1.1",
        client_id: process.env.MOVES_CLIENT_ID,
        client_secret: process.env.MOVES_CLIENT_SECRET,
        redirect_uri: process.env.MOVES_REDIRECT_URI
    });

exports.authorizeMovesUser = function (req, res) {
    res.redirect(
        moves.authorize({scope: ['activity', 'location'], state: '123'})
    );
};

exports.handleMovesAuth = function (req, res) {
    moves.token(req.query.code, function (err, result, body) {
        if (err) {
            console.log(err.body);
            res.send("Didn't work");
        } else {
            var parsedBody = JSON.parse(body);
            res.send('Ya! Access token is ' + parsedBody.access_token + ' Refresh token is ' + parsedBody.refresh_token);
        }
    });
};