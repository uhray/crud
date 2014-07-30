
var utools = require('utools'),
    tools = require('./tools'),
    path = require('path'),
    proto = module.exports = exports = {};

proto.entity = function(route, opts) {
  var e = tools.entity(route, opts);
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
          called = 0,
          fn = function(req, res) {
            var d = method == 'get' ? req.query : req.body;
            obj.cb(d || {}, function(e, d) {
              if (called++)
                return console.warn('callback called %d times', called);
              res.json({ error: e, data: d });
            }, req, res);
          };
      app[method](p, auth, fn);
    }
  });
}

proto.autodoc = function() {
  // requiring modules here for efficiency
  var ejs = require('ejs'),
      fs = require('fs'),
      temp_path = path.join(__dirname, 'tools/document_template.ejs'),
      temp_str = fs.readFileSync(temp_path).toString(),
      entities = this._entities.sort(function(a, b) {
        return a.route().localeCompare(b.route());
      }),
      data = { entities: entities };

  ejs.filters.anchor = anchor;
  ejs.filters.stringify = stringify;

  console.log(ejs.render(temp_str, data));

  function anchor(d) {
    return d.replace(/[:\/]/g, '');
  }

  function stringify(d) {
    return JSON.stringify(d, null, 2).replace(/\n/g, '\n  ');
  }

}

proto.cb = tools.cb;
