var test = require('unit.js'),
    async = require('async'),
    define = global.define = function(d, fn) {
      deps = d;
      crud = fn();
    },
    deps, crud;

require('../dist/crud');
mockRequest();

describe('frontend - tools', function() {

  it('tools.id', function() {
    crud.__tools.id(7).must.equal(7);
    crud.__tools.id({}).must.eql({});
  });

  it('tools.join', function() {
    crud.__tools.join('test', 'this', 'that')
        .must.equal('test/this/that');

    crud.__tools.join('/test', '//this/that', '7')
        .must.equal('/test/this/that/7');

    crud.__tools.join('/test', { a: 7, b: 8 })
        .must.equal('/test?a=7&b=8');

    crud.__tools.join('/test', { a: [6, 7], b: { c: 8 } })
        .must.equal('/test?a%5B0%5D=6&a%5B1%5D=7&b%5Bc%5D=8');

    crud.__tools.join('/test', { a: [6, 7], b: { c: 8 } })
        .must.equal('/test?a%5B0%5D=6&a%5B1%5D=7&b%5Bc%5D=8');
  });

  it('tools.serialize', function() {
    crud.__tools.serialize({ a: [6, 7], b: { c: 8 } })
        .must.equal('a%5B0%5D=6&a%5B1%5D=7&b%5Bc%5D=8');

  });

  it('tools.merge', function() {
    var a = { b: 7, c: 8, d: 9 },
        b = { a: 8, b: 9 },
        c = crud.__tools.merge(a, b);

    c.must.eql({ a: 8, b: 9, c: 8, d: 9 });
    c.must.equal(a);
    c.must.not.equal(b);
    c.must.not.eql(b);
  });

  it('tools.merge', function() {
    var fn = Function();

    crud.__tools.xhrargs('--data--', '--callback--')
        .must.eql({ data: '--data--', cb: '--callback--' });

    crud.__tools.xhrargs(fn)
        .must.eql({ data: {}, cb: fn });
  });

  it('tools.request', function(cb) {

    async.series([
      function(cb) {
        XMLHttpRequest.prototype.mockResponse = function() {
          this.status = 200;
          this.readyState = 4;
          this.responseText = {
            data: '--data--',
            error: null,
            metadata: '--metadata--'
          };
          this.responseText = JSON.stringify(this.responseText);
        };

        crud.__tools.request('get', '/api/users', '--data--',
                             function(e, d, m) {
          XMLHttpRequest.prototype.mockResponse = null;
          test.assert(!e);
          d.must.equal('--data--');
          m.must.equal('--metadata--');
          cb();
        });
      },
      function(cb) {
        XMLHttpRequest.prototype.mockResponse = function() {
          this.status = 404;
          this.readyState = 4;
          this.responseText = {};
          this.responseText = JSON.stringify(this.responseText);
        };

        crud.__tools.request('get', '/api/users', '--data--',
                             function(e, d, m) {
          XMLHttpRequest.prototype.mockResponse = null;
          e.must.be.an.object();
          e.code.must.equal(404);
          cb();
        });
      },
      function(cb) {
        XMLHttpRequest.prototype.mockResponse = function() {
          this.status = 200;
          this.readyState = 4;
          this.responseText = { error: '--error--' };
          this.responseText = JSON.stringify(this.responseText);
        };

        crud.__tools.request('get', '/api/users', '--data--',
                             function(e, d, m) {
          XMLHttpRequest.prototype.mockResponse = null;
          e.must.equal('--error--');
          cb();
        });
      },
      function(cb) {
        XMLHttpRequest.prototype.mockResponse = function() {
          cb();
        };

        crud.__tools.request('get', '/api/users', '--data--',
                             function(e, d, m) {
          test.assert(false, 'Should not get here');
        });
        crud.cancelAll();
      }
    ], function(e) {
      test.assert(!e);
      cb();
    });
  });

  it('tools.foreach', function() {
    var obj;

    test.when('we loop through an object', function() {
          obj = { a: 7, b: 8, c: 9 };
        })
        .then('test looping through the object', function() {
          var keys = [],
              values = [];

          crud.__tools.forEach(obj, function(v, k) {
            keys.push(k);
            values.push(v);
          });

          keys.sort();
          values.sort();

          keys.must.eql(Object.keys(obj).sort());
          values.must.eql([7, 8, 9]);
        })
        .when('we loop through an array', function() {
          obj = [7, 8, 9];
        })
        .then('test looping through the object', function() {
          var a = [],
              b = [];

          crud.__tools.forEach(obj, function(v, k) {
            a.push(v, k);
          });

          obj.forEach(function(v, k) {
            b.push(v, k);
          });

          a.must.eql(b);
        })
  });

  it('tools.defineProperty', function() {
    var obj = {};

    test.assert(!crud.__tools.defineProperty());

    crud.__tools.defineProperty(obj, '_crud', '--crud-val--');

    obj._crud.must.equal('--crud-val--');
    crud.__tools.forEach(obj, function(val, key) {
      key.must.not.equal('_crud');
    });
  });

});

describe('request types', function() {

  it('create', function(cb) {
    XMLHttpRequest.prototype.mockResponse = function() {
      this.requestInfo.must.eql({
        data: '"--data--"',
        url: '/api/path',
        method: 'POST'
      });
      this.status = 200;
      this.readyState = 4;
    };

    crud('/path').create('--data--', function() { cb(); });
  });

  it('read', function(cb) {
    XMLHttpRequest.prototype.mockResponse = function() {
      this.requestInfo.must.eql({
        data: undefined,
        url: '/api/path?a=7',
        method: 'GET'
      });
      this.status = 200;
      this.readyState = 4;
    };

    crud('/path').read({ a: 7 }, function() { cb(); });
  });

  it('update', function(cb) {
    XMLHttpRequest.prototype.mockResponse = function() {
      this.requestInfo.must.eql({
        data: '"--data--"',
        url: '/api/path',
        method: 'PUT'
      });
      this.status = 200;
      this.readyState = 4;
    };

    crud('/path').update('--data--', function() { cb(); });
  });

  it('delete', function(cb) {
    XMLHttpRequest.prototype.mockResponse = function() {
      this.requestInfo.must.eql({
        data: '"--data--"',
        url: '/api/path',
        method: 'DELETE'
      });
      this.status = 200;
      this.readyState = 4;
    };

    crud('/path').del('--data--', function() { cb(); });
  });

});

describe('utility fns', function() {
  // some of these are in tools. will nto test those again.

  it('crud.parallel', function(cb) {
    XMLHttpRequest.prototype.mockResponse = function() {
      this.status = 200;
      this.readyState = 4;
      this.responseText = { data: this.requestInfo.url };
      this.responseText = JSON.stringify(this.responseText);
    };

    crud.parallel({
      users: '/users',
      others: '/others'
    }, function(e, d) {
      d.must.eql({
        users: '/api/users',
        others: '/api/others'
      });
      cb();
    });

  });

  it('crud.create', function() {
    crud.create.must.be.a.function();
    crud.create().create.must.be.a.function();
  });

  it('crud.url', function() {
    crud.url.must.equal(crud.__tools.join);
  });

  it('crud.serialize', function() {
    crud.serialize.must.equal(crud.__tools.serialize);
  });

  it('crud.cursor', function(cb) {
    var cursor;

    XMLHttpRequest.prototype.mockResponse = function() {
      this.status = 200;
      this.readyState = 4;
      this.responseText = {
        data: this.requestInfo.url,
        metadata: { records: 100 }
      };
      this.responseText = JSON.stringify(this.responseText);
    };

    cursor = crud.cursor('/users', 100, 0);
    cursor.next(function(e, d) {
      d.must.equal('/api/users?page=0&perPage=100&');
      cursor.next(function(e, d) {
        d.must.equal('/api/users?page=1&perPage=100&');
        cb();
      });
    });

  });

});

// Mock request tool
function mockRequest() {
  global.XMLHttpRequest = XMLHttpRequest;

  XMLHttpRequest.prototype.setRequestHeader = function(a, b) {
    this._data.headers[a] = b;
  };

  XMLHttpRequest.prototype.open = function(method, url, async) {
    async.must.be.true();
    url.must.be.a.string();
    method.must.be.a.string();
    this.requestInfo = {
      method: method,
      url: url
    };
  };

  XMLHttpRequest.prototype.send = function(data) {
    var self = this;
    this.requestInfo.data = data;
    setTimeout(function() {
      self.mockResponse && self.mockResponse();
      self.onreadystatechange && self.onreadystatechange();
    }, 50);
  };

  function XMLHttpRequest() {
    this._data = {};
    this._data.headers = {};
  }
}
