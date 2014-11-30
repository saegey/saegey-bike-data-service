var paginate = require('express-paginate');

function ModelHelper() {}

ModelHelper.paginate = function (model, filter, req, next, sortField) {
  var sortConfig = {};
  sortConfig[sortField || 'date'] = -1;
  model.paginate(filter, req.query.page, req.query.limit, function(err, pageCount, items) {
    if (err) { throw err; }
    next({
      object: 'list',
      has_more: paginate.hasNextPages(req)(pageCount),
      data: items
    });
  }, { sortBy: sortConfig });
};

module.exports = ModelHelper;
