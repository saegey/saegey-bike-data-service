/*jslint node: true */
/*jslint nomen: true */
'use strict';

var paginate = require('express-paginate');

function ModelHelper() {}

ModelHelper.paginate = function (model, filter, req, next) {
    model.paginate(filter, req.query.page, req.query.limit, function(err, pageCount, items, itemCount) {
        if (err) { throw err; }
        next({
            object: 'list',
            has_more: paginate.hasNextPages(req)(pageCount),
            data: items
        })
    }, { sortBy : { date : -1 } });
};

module.exports = ModelHelper;
