
var events = require('events'),
    merge = require('./merge'),
    debug = require('debug')('crud'),
    timeout = require('connect-timeout'),
    path = require('path'),
    cors = require('cors'),
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
  this.on('error', function() { /* stifle auto exit on error */ });
  debug('Creating `%s` method for `%s` entity', method, this._entity._route);
}

Method.prototype = proto;

// Create Prototype ============================================================

proto.use = function Use(fn) {
  this._chain.push(function(data, query, cb) {
    fn.call(this.express, this.request, this.response,
            function next(e) { cb(e) });
  });
  return this;
}

proto.pipe = function Pipe(fn) {
  this._chain.push(fn);
  return this;
}

proto.__createCors = function createCors(obj) {
  if (!obj) return function(a, b, c) { c() };
  obj = merge({
           credentials: true,
           origin: function(o, cb) { cb(null, true); }
        }, typeof obj == 'object' ? obj : {});
  return cors(obj);
}

proto.__launch = function LaunchMethod(app, cfg) {
  var self = this,
      method = this._method,
      corsFn = this.__createCors(cfg.cors),
      route = path.join(cfg.base || '/api', this._entity._route).replace(/\\/g, '/');

  debug('Launching `%s` method for `%s` entity. cors=%s',
        method, route, !!cfg.cors);

  if (cfg.cors) app.options(route, corsFn);

  app[method](route, timeout(cfg.timeout || 10e3), corsFn,
              function(req, res) {
    var ctx = {
          request: req,
          response: res,
          entity: self._entity,
          method: self,
          callback: next,
          query: merge(req.query || {}, req.params),
          data: req.body || {},
          metadata: {},
          express: this,
          close: close
        },
        idx = 0,
        responded = false,
        chain = self._chain;

    self.emit('open', ctx.data, ctx.query);
    self._entity.emit('open', self._name, ctx.data, ctx.query);
    debug('%s | %s - starting chain. \n       data  -> %j\n       query -> %j',
          method, route, ctx.data, ctx.query);
    next();

    function close() {
      if (responded) return;
      responded = true;
      self.emit('close', ctx.data);
      self._entity.emit('close', self._name, ctx.data);
      req.clearTimeout();
      debug('%s | %s - close. %j', method, route,
            { error: null, data: ctx.data, stream: true });
    }

    function next(e, d, q, m) {
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

      // override metadata
      if (len >= 4) {
        ctx.metadata = m;
        debug('%s | %s - metadata changed. %j', method, route, ctx.metadata);
      }

      // error
      if (e) {
        if (!responded && !req.timedout) {
          res.set('Cache-Control', 'no-cache');

          res.status(e.status || 200)

          // only allow e.message if status is provided
          if (e.status) res.json({ error: e.message || e });
          else res.json({ error: e });

        }
        responded = true;
        debug('%s | %s - error. %j', method, route, e);
        self.emit('error', e);
        return;
      }

      // no more left to chain
      if (!fn) {
        if (!responded && !req.timedout) {
          res.set('Cache-Control', 'no-cache');
          res.json({ error: null, data: ctx.data, metadata: ctx.metadata });
        }
        responded = true;
        self.emit('close', ctx.data);
        self._entity.emit('close', self._name, ctx.data);
        debug('%s | %s - close. %j', method, route,
              { error: null, data: ctx.data, metadata: ctx.metadata });
        return;
      }

      // keep chaining
      fn.call(ctx, ctx.data, ctx.query, next);
    }

  });
}
