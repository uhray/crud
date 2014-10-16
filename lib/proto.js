
var tools = require('require-dir')('./tools'),
    path = require('path'),
    timeout = require('connect-timeout'),
    proto = module.exports = exports = {};

proto.tools = tools;

proto.configure = function(cfg) {
  this.config = cfg;
}

proto.entity = function(route, opts) {
  var e = this._entities[route] || tools.entity(route, opts);
  this._entities[route] = e;
  return e;
}

proto.launch = function(app) {
  for (var k in this._entities) {
    this._entities[k].__launch(app, this.config);
  }
}
