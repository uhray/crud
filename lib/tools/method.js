
var events = require('events'),
    merge = require('./merge'),
    debug = require('debug')('crud'),
    timeout = require('connect-timeout'),
    path = require('path'),
    proto = merge({}, events.EventEmitter.prototype);

module.exports = exports = Method;

// Define Method ===============================================================

function Method(entity, name, method, opts) {
  if (!(this instanceof Method)) return new Method(entity, name, method, opts);
  this._entity = entity;
  this._name = name;
  this._method = method;
  this._options = opts || {};
  this._chain = [];
  debug('Creating `%s` method for `%s` entity', method, this._entity._route);
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

  debug('Launching `%s` method for `%s` entity', method, route);

  app[method](route, timeout(cfg.timeoute || 10e3), function(req, res) {
    var ctx = {
          request: req,
          response: res,
          entity: self._entity,
          method: self,
          callback: next,
          query: req.query || {},
          data: req.body || {},
          express: this
        },
        idx = 0,
        responded = false,
        chain = self._chain;

    self.emit('open', ctx.data, ctx.query);
    self._entity.emit('open', self._name, ctx.data, ctx.query);
    debug('%s | %s - starting chain. \n       data  -> %j\n       query -> %j',
          method, route, ctx.data, ctx.query);
    next();

    function next(e, d, q) {
      var fn = chain[idx++],
          len = arguments.length;

      // override data
      if (len >= 2) {
        req.body = ctx.data = d;
        debug('%s | %s - data changed. %j', method, route, ctx.data);
      }

      // override query
      if (len >= 3) {
        req.query = ctx.query = q;
        debug('%s | %s - query changed. %j', method, route, ctx.query);
      }

      // error
      if (e) {
        if (!responded) res.json({ error: e });
        responded = true;
        debug('%s | %s - error. %j', method, route, e);
        self.emit('error', e);
        return;
      }

      // no more left to chain
      if (!fn) {
        if (!responded) res.json({ error: null, data: ctx.data });
        responded = true;
        self.emit('close', ctx.data);
        self._entity.emit('close', self._name, ctx.data);
        debug('%s | %s - close. %j', method, route,
              { error: null, data: ctx.data });
        return;
      }

      // keep chaining
      fn.call(ctx, ctx.data, ctx.query, next);
    }

  });
}
