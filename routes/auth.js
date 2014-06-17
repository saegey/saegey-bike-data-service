var Moves = require("moves"), 
   	moves = new Moves({
        api_base: "https://api.moves-app.com/api/1.1",
        client_id: process.env.MOVES_CLIENT_ID,
        client_secret: process.env.MOVES_CLIENT_SECRET,
        redirect_uri: process.env.MOVES_REDIRECT_URI
    }),
    ig = require('instagram-node').instagram(),
    redirect_uri = process.env.INSTAGRAM_REDIRECT_URI;

ig.use({
    client_id: process.env.INSTAGRAM_CLIENT_ID,
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET
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

exports.authorizeInstagramUser = function (req, res) {
    res.redirect(ig.get_authorization_url(redirect_uri, { state: '123' }));
};

exports.handleInstagramAuth = function (req, res) {
    ig.authorize_user(req.query.code, redirect_uri, function (err, result) {
        if (err) {
            console.log(err.body);
            res.send("Didn't work");
        } else {
            console.log('Yay! Access token is ' + result.access_token);
            res.send('You made it!!' + result.access_token);
        }
    });
};
