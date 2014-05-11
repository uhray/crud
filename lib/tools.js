
var utools = require('utools'),
    Validator = require('jsonschema').Validator,
    validate = new Validator(),
    tools = module.exports = exports = {};

tools.entity = utools.fluent(function(route) {
  var self = this;
  self.var('_c');
  self.var('_r');
  self.var('_u');
  self.var('_d');
  self.var('route', route);

  self.function('c', method('c'));
  self.function('create', method('c'));
  self.function('r', method('r'));
  self.function('retrieve', method('r'));
  self.function('u', method('u'));
  self.function('update', method('u'));
  self.function('d', method('d'));
  self.function('delete', method('d'));

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
