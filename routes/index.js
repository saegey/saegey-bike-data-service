exports.index = function (req, res) {
    res.render('index', { title: 'Home', user: req.user });
};

exports.dashboard = function (req, res) {
    res.render('index', { title: 'Dashboard', user: req.user });
};
