/*jslint node: true */
/*jslin nomen: true */
'use strict';

var ig = require('instagram-node').instagram();
ig.use({
    client_id: process.env.INSTAGRAM_CLIENT_ID,
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET
});

var redirect_uri = 'http://localhost:5000/instagram/token';

exports.authorizeUser = function (req, res) {
    res.redirect(ig.get_authorization_url(redirect_uri, { state: 'a state' }));
};

exports.handleAuth = function (req, res) {
    ig.authorize_user(req.query.code, redirect_uri, function (err, result) {
        if (err) {
            console.log(err.body);
            res.send("Didn't work");
        } else {
            console.log('Yay! Access token is ' + result.access_token);
            res.send('You made it!!');
        }
    });
};