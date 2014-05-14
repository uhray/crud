
var utools = require('utools'),
    Validator = require('jsonschema').Validator,
    validate = new Validator(),
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

tools.cb = function(params, fn) {
  check.params = params;
  check.cb = fn;
  return check;

  function check(d, cb, req, res) {
    var v = tools.validate(params, d);
    if (v) fn.apply(this, arguments);
    else cb('params validation failed');
  }
}
