
var utools = require('utools'),
    events = require('events'),
    proto = require('./proto');

module.exports = exports = CRUD;

function CRUD(cfg) {
  var args = arguments;
  if (!(this instanceof CRUD)) return new CRUD(cfg);
  (this.__init || []).forEach(function(i) { i.apply(this, args); }, this);
}

utools.merge(CRUD.prototype, events.EventEmitter.prototype);
utools.merge(CRUD.prototype, proto);
(CRUD.prototype.__init = CRUD.prototype.__init || []).push(init);

function init(cfg) {
  this.config = cfg || {};
  this._entities = [];
}
