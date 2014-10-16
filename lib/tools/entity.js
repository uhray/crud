
var events = require('events'),
    Method = require('./method'),
    merge = require('./merge'),
    proto = merge({}, events.prototype);

module.exports = exports = Entity;

// Define Entity ===============================================================

function Entity(route, opts) {
  if (!(this instanceof Entity)) return new Entity(route, opts);
  this._route = route;
  this._options = opts || {};
  this._methods = {};
}

Entity.prototype = proto;

// Create Prototype ============================================================

proto.Create = function CreateEntity(opts) {
  return this._methods.post =
         this._methods.post || new Method(this, 'create', 'post', opts);
}

proto.Read = function ReadEntity(opts) {
  return this._methods.get =
         this._methods.get || new Method(this, 'read', 'get', opts);
}

proto.Update = function UpdateEntity(opts) {
  return this._methods.put =
         this._methods.put || new Method(this, 'update', 'put', opts);
}

proto.Delete = function DeleteEntity(opts) {
  return this._methods['delete'] =
         this._methods['delete'] || new Method(this, 'delete', 'delete', opts);
}

proto.__launch = function LaunchEntity(app, cfg) {
  for (var k in this._methods) {
    this._methods[k].__launch(app, cfg);
  }
}
