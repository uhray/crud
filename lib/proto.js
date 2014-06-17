
var utools = require('utools'),
    tools = require('./tools'),
    path = require('path'),
    proto = module.exports = exports = {};

proto.entity = function(route) {
  var e = tools.entity(route);
  this._entities.push(e);
  return e;
}

proto.launch = function(app) {
  this._entities.forEach(function(e) {
    var p = path.join('/api', e.route()),
        c = e._c(),
        r = e._r(),
        u = e._u(),
        d = e._d();

    if (c) make_route('post', c);
    if (r) make_route('get', r);
    if (u) make_route('put', u);
    if (d) make_route('delete', d);

    function make_route(method, obj) {
      var auth = obj.auth || function(req, res, next) { next() },
          fn = function(req, res) {
            var d = method == 'get' ? req.query : req.body;
            obj.cb(d || {}, function(e, d) {
              res.json({ error: e, data: d });
            });
          }
      app[method](p, auth, fn);
    }
  });
}

proto.autodoc = function() {
  // TODO output markdown documentation
  console.log('DOCUMENTATION UNDER CONSTRUCTION');
}

proto.cb = tools.cb;
