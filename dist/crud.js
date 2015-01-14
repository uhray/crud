define([], function() {
  var tools = get_tools(),
      Emitter = get_emitter(),
      config = {
        base: '/api',
        idGetter: '_id',
        protocol: '',
        credentials: false
      };

  function crud() {
    var c;
    if (!(this instanceof crud)) {
      c = new crud();
      c.path = tools.join.apply(c, arguments);
      return c;
    }

    if (arguments.length) this.path = tools.join.apply(this, arguments);

    Emitter(this);
  }

  // Configure =================================================================

  crud.configure = crud.config = function(obj) {
    tools.merge(config, obj || {});
  }


  // crud.prototype ============================================================
  crud.prototype = Emitter.prototype;

  crud.prototype.create = crud.prototype.c = function() {
    var self = this,
        args = tools.xhr_args.apply(this, arguments),
        url = config.protocol + tools.join(config.base, this.path);

    tools.request('POST', url, args.data, function(e, d) {
      if (e && cb) self.emit('error', e);
      if (!e && d) self.emit('create', d);
      args.cb && args.cb.call(self, e, d);
    });

    return this;
  };

  crud.prototype.read = crud.prototype.r = function() {
    var self = this,
        args = tools.xhr_args.apply(this, arguments),
        url = config.protocol + tools.join(config.base, this.path);

    tools.request('GET', url, null, function(e, d) {
      self.data = d;
      if (e && !args.cb) self.emit('error', e);
      if (!e && d) self.emit('read', d);
      if (!e && d instanceof Array) {
        self.each(function(d, i) {
          this.data = d;
          self.emitCtx('each', this, d, i);
        });
      }
      args.cb && args.cb.call(self, e, d);
    });
    return this;
  };

  crud.prototype.update = crud.prototype.u = function() {
    var self = this,
        args = tools.xhr_args.apply(this, arguments),
        url = config.protocol + tools.join(config.base, this.path);

    tools.request('PUT', url, args.data, function(e, d) {
      if (e && !args.cb) self.emit('error', e);
      if (!e && d) self.emit('update', d);
      args.cb && args.cb.call(self, e, d);
    });

    return this;
  };

  crud.prototype.del = crud.prototype.d = function() {
    var self = this,
        args = tools.xhr_args.apply(this, arguments),
        url = config.protocol + tools.join(config.base, this.path);

    tools.request('DELETE', url, args.data, function(e, d) {
      if (e && !args.cb) self.emit('error', e);
      if (!e && d) self.emit('delete', d);
      args.cb && args.cb.call(self, e, d);
    });

    return this;
  };

  crud.prototype.each = function(fn) {
    var fn = fn || Function(),
        data = this.data || [],
        i;
    if (!(data instanceof Array)) return;

    for (i = 0; i < data.length; i++) {
      fn.call(crud(this.path, data[i][config.idGetter]), data[i], i);
    }
  };

  // crud fns ==================================================================

  crud.parallel = function(obj, cb) {
    var obj = obj || {},
        n = Object.keys(obj).length,
        result = {},
        count = 0,
        cb = cb || Function(),
        done, k;

    tools.forEach(obj, function(path, name) {
      crud(path).read(function(e, d) {
        if (e) {
          done = true;
          return cb(e, result);
        }

        result[name] = d;
        if (++count == n && !done) {
          done = true;
          setTimeout(function() { cb(null, result); }, 0);
        }
      });
    });
  };

  return crud;

  // tools =====================================================================

  function get_tools() {
    var tools = {};

    tools.noop = Function();
    tools.id = function(d) { return d; }

    tools.argArray = function(args) {
      return Array.prototype.slice.call(args, 0);
    }

    tools.join = function() {
      return tools.argArray(arguments).join('/')
                  .replace(/\/+/g, '/');
    }

    tools.merge = function(a, b) {
      for (var k in b) a[k] = b[k];
      return a;
    }

    tools.xhr_args = function(d, cb) {
      if (typeof(d) === 'function') return { data: {}, cb: d };
      else return { data: d || {}, cb: cb };
    }

    tools.request = function(method, url, data, cb) {
      var req = typeof(XMLHttpRequest) != 'undefined'
                  ? new XMLHttpRequest()
                  : new ActiveXObject('Microsoft.XMLHTTP'),
          isjson = typeof(FormData) === 'undefined' ||
                        !(data instanceof FormData);

      if (config.credentials) req.withCredentials = true;
      req.open(method, url, true);

      if (isjson) req.setRequestHeader('Content-type', 'application/json');
      req.onreadystatechange = function() {
        var status, data, error;
        if (req.readyState == 4) {  // done
          status = req.status;
          if (status == 200) {
            try {
              data = JSON.parse(req.responseText);
              error = data && data.error;
              data = data && data.data;
            } catch (e) { error = 'invalid json response' };
          } else {
            error = { code: status, message: 'invalid status code' };
          }
          return cb && cb(error, data);
        }
      }
      if (!isjson) req.send(data);
      else if (data) req.send(JSON.stringify(data));
      else req.send();
    }

    tools.forEach = function(obj, cb) {
      var k;
      for (k in obj) cb(obj[k], k);
    }

    return tools;
  }

  // emitter ===================================================================
  function get_emitter() {
    function Emitter(n) {
      n = n || this;
      n.__events = n.__events || {};
      n.__once = n.__once || {};
    }

    Emitter.prototype.on = function(name, fn) {
      fn = fn || Function();
      this.__events[name] = (this.__events[name] || [])
      this.__events[name].push(fn);
    }

    Emitter.prototype.once = function(name, fn) {
      fn = fn || Function();
      this.__once[name] = (this.__once[name] || []);
      this.__once[name].push(fn);
    }

    Emitter.prototype.off = function(name, fn) {
      var i;

      fn = fn || Function();
      i = (this.__events[name] || []).indexOf(fn);
      if (~i) this.__events[name].splice(i, 1);

      i = (this.__once[name] || []).indexOf(fn);
      if (~i) this.__once[name].splice(i, 1);
    }

    Emitter.prototype.emit = function(name) {
      var args = [].slice.call(arguments),
          es = (this.__events[name] || []).slice(),
          i, self = this;

      args.shift();
      es.push.apply(es, this.__once[name] || []);

      for (i = 0; i < es.length; i++) {
        es[i].apply(self, args);
      }

      this.__once[name] = [];
    }

    Emitter.prototype.emitCtx = function(name, ctx) {
      var args = [].slice.call(arguments),
          es = (this.__events[name] || []).slice(),
          i, self = this;

      args.shift(); args.shift();
      es.push.apply(es, this.__once[name] || []);

      for (i = 0; i < es.length; i++) {
        es[i].apply(ctx, args);
      }

      this.__once[name] = [];
    }

    return Emitter;
  }
});
