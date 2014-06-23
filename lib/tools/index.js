
var utools = require('utools'),
    Validator = require('jsonschema').Validator,
    validate = new Validator(),
    debug = require('debug')('crud'),
    tools = module.exports = exports = {};

tools.entity = utools.fluent(function(route, opts) {
  var self = this,
      opts = opts || {};
  self._var('_c');
  self._var('_r');
  self._var('_u');
  self._var('_d');
  self._var('route', route);
  self._var('name', opts.name);
  self._var('description', opts.description);

  self._function('c', method('c'));
  self._function('create', method('c'));
  self._function('r', method('r'));
  self._function('read', method('r'));
  self._function('u', method('u'));
  self._function('update', method('u'));
  self._function('d', method('d'));
  self._function('delete', method('d'));

  function method(type) {
    return function(auth, cb) {
      if (!arguments.length || !auth) return;
      if (!cb) { cb = auth; auth = null; }
      self['_' + type]({ auth: auth, cb: cb });
    }
  }
});

tools.validate = function(sch, obj) {
  var schema = {
        type: 'object',
        properties: sch
      },
      res = validate.validate(obj, schema);
  return !(res.errors && res.errors.length);
}

tools.cb = function(fn, options) {
  var options = options || {},
      params = check.params = options.params,
      res_schema = check.response = options.response;
      cb = check.cb = fn;

  check.name = options.name;
  check.description = options.description;

  return check;

  function check(d, cb, req, res) {
    var v = !params || tools.validate(params, d),
        callback = res_schema ? check_res : cb;
    if (v) fn.call(this, d, callback, req, res);
    else {
      cb('params validation failed');
      debug('validation failed: %j instead of %j', d, params);
    }

    function check_res(e, d) {
      if (debug.enabled && d && !e && !tools.validate(res_schema, d)) {
        debug('incorrect schema on js response: %j', d);
      }
      cb(e, d);
    }
  }
}
