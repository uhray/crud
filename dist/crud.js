define([], function() {

  return makeCrud();

  function makeCrud(cfg) {
    var config = {
          base: '/api',
          idGetter: '_id',
          protocol: '',
          credentials: false,
          getData: function(d) { return d && d.data; },
          getError: function(d) { return d && d.error; }
        },
        tools = get_tools(config),
        Emitter = get_emitter(config);

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

    tools.merge(config, cfg || {});

    // Configure =================================================================

    crud.configure = crud.config = function(obj) {
      return tools.merge(config, obj || {});
    }


    // crud.prototype ============================================================
    crud.prototype = Emitter.prototype;

    crud.prototype.toJSON = function() {
      // polyfill so we can have the _crud value and not have it json'ed on IE8
      return undefined;
    };

    crud.prototype.create = crud.prototype.c = function() {
      var self = this,
          args = tools.xhr_args.apply(this, arguments),
          url = config.protocol + tools.join(config.base, this.path);

      tools.request('POST', url, args.data, function(e, d) {
        if (e) self.emit('error', e);
        if (!e && d) {
          tools.defineProperty(d, '_crud', crud(self.path, d[config.idGetter]));
          self.emit('create', d);
        }
        args.cb && args.cb.call(self, e, d);
      });

      return this;
    };

    crud.prototype.read = crud.prototype.r = function() {
      var self = this,
          args = tools.xhr_args.apply(this, arguments),
          url = config.protocol +
                  tools.join(config.base, this.path, args.data || '');

      tools.request('GET', url, null, function(e, d) {
        self.data = d;
        tools.defineProperty(d, '_crud', self);
        if (e && !args.cb) self.emit('error', e);
        if (!e && d instanceof Array) {
          self.each(function(d, i) {
            this.data = d;
            self.emitCtx('each', this, d, i);
          });
        }
        if (!e && d) self.emit('read', d);
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
        if (!e && d) {
          tools.defineProperty(d, '_crud', crud(self.path, d[config.idGetter]));
          self.emit('update', d);
        }
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
          c, i;

      if (!(data instanceof Array)) return;

      for (i = 0; i < data.length; i++) {
        c = crud(this.path, data[i][config.idGetter]);
        tools.defineProperty(data[i], '_crud', c);
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
            if (done) return;
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

    crud.create = makeCrud;
    crud.url = tools.join;
    crud.serialize = tools.serialize;

    return crud;
  }

  // tools =====================================================================

  function get_tools(config) {
    var tools = {};

    tools.noop = Function();
    tools.id = function(d) { return d; }

    tools.argArray = function(args) {
      return Array.prototype.slice.call(args, 0);
    }

    tools.join = function() {
      var query = '',
          arr = tools.argArray(arguments).map(function(d) {
            var d = typeof d == 'object' ? '?' + tools.serialize(d) : d,
                s;

            s = (d && String(d) || '').split('?');
            if (s.length == 1) return d;
            if (query) query += '&';
            query += s[1];
            return s[0];
          }).filter(tools.id);

      return arr.join('/').replace(/\/+/g, '/') + (query ? '?' + query : '');
    }

    tools.serialize = function(obj, prefix) {
      var str = [], p, k;
      for (p in obj) {
        if (obj.hasOwnProperty(p)) {
          k = prefix ? prefix + '[' + p + ']' : p, v = obj[p];
          if (v instanceof Date) v = JSON.stringify(v);
          str.push(typeof v == 'object'
                    ? tools.serialize(v, k)
                    : encodeURIComponent(k) + '=' + encodeURIComponent(v));
        }
      }
      return str.join('&');
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
          if (status >= 200 && status < 300) {
            try {
              data = JSON.parse(req.responseText || '{}');
              error = config.getError(data);
              data = config.getData(data);
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
    };

    tools.forEach = function(obj, cb) {
      var k;
      for (k in obj) cb(obj[k], k);
    };

    tools.defineProperty = function(obj, key, val) {
      if (!(obj instanceof Object)) return;
      try {
        Object.defineProperty(obj, key, {
          enumerable: false,
          value: val
        });
      } catch (e) {  // fallback
        obj[key] = val;
      }
    };

    return tools;
  };

  // emitter ===================================================================
  function get_emitter(config) {
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
