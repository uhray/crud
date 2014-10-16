
var events = require('events'),
    merge = require('./merge'),
    debug = require('debug')('crud'),
    timeout = require('connect-timeout'),
    path = require('path'),
    proto = merge({}, events.prototype);

module.exports = exports = Method;

// Define Method ===============================================================

function Method(entity, name, method, opts) {
  if (!(this instanceof Method)) return new Method(entity, name, method, opts);
  this._entity = entity;
  this._name = name;
  this._method = method;
  this._options = opts || {};
  this._chain = [];
}

Method.prototype = proto;

// Create Prototype ============================================================

proto.use = function Use(fn) {
  this._chain.push(function(data, query, cb) {
    fn.call(this.express, this.request, this.reponse,
            function next(e) { cb(e) });
  });
  return this;
}

proto.pipe = function Pipe(fn) {
  this._chain.push(fn);
  return this;
}

proto.__launch = function LaunchMethod(app, cfg) {
  var self = this,
      method = this._method,
      route = path.join(cfg.base || '/api', this._entity._route);

  debug('launching `%s` method for `%s` entity', method, route);

  app[method](route, timeout(cfg.timeoute || 10e3), function(req, res) {
    var data = req.body || {},
        query = req.query || {},
        ctx = {
          request: req,
          response: res,
          entity: self._entity,
          method: self,
          callback: next,
          query: query,
          data: data,
          express: this
        },
        idx = 0,
        chain = self._chain;

    next();

    function next(e, d, q) {
      var fn = chain[idx++],
          len = arguments.length;

      // override data
      if (len >= 2) data = req.body = ctx.data = d;
      if (len >= 3) query = req.query = ctx.query = q;

      // error
      if (e) return res.json({ error: e });

      // no more left to chain
      if (!fn) return res.json({ error: e, data: d });

      // keep chaining
      fn.call(ctx, data, query, next);
    }

  });
}

