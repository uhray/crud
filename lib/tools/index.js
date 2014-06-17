
var utools = require('utools'),
    Validator = require('jsonschema').Validator,
    validate = new Validator(),
    debug = require('debug')('crud'),
    tools = module.exports = exports = {};

tools.entity = utools.fluent(function(route) {
  var self = this;
  self._var('_c');
  self._var('_r');
  self._var('_u');
  self._var('_d');
  self._var('route', route);

  self._function('c', method('c'));
  self._function('create', method('c'));
  self._function('r', method('r'));
  self._function('retrieve', method('r'));
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

tools.cb = function(params, fn, res_schema) {
  check.params = params;
  check.cb = fn;
  check.res = res_schema;
  return check;

  function check(d, cb, req, res) {
    var v = tools.validate(params, d),
        callback = res_schema ? check_res : cb;
    if (v) fn.call(this, d, callback, req, res);
    else cb('params validation failed');

    function check_res(e, d) {
      if (debug.enabled && d && !e && !tools.validate(res_schema, d)) {
        debug('incorrect schema on js response:', d);
      }
      cb(e, d);
    }
  }
}
