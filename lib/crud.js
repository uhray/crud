
var utools = require('utools'),
    events = require('events'),
    tools = require('require-dir')('./tools'),
    proto = tools.merge(require('./proto'), events.EventEmitter.prototype);

function CRUD(cfg) {
  if (!(this instanceof CRUD)) return new CRUD(cfg);
  this.config = cfg || {};
  this._entities = {};
}

CRUD.prototype = proto;
module.exports = exports = new CRUD();

