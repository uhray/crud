var test = require('unit.js'),
    crud = require('../lib/crud'),
    tools = require('require-dir')('../lib/tools');

describe('utilty tools', function() {

  it('merge', function() {
    var a = { b: 7, c: 8, d: 9 },
        b = { a: 8, b: 9 },
        c = tools.merge(a, b);

    c.must.eql({ a: 8, b: 9, c: 8, d: 9 });
    c.must.equal(a);
    c.must.not.equal(b);
    c.must.not.eql(b);
    tools.merge(null, null).must.be.an.object();
    tools.merge(null, { a: 9 }).must.eql({ a: 9 });
  });

});

describe('methods and entities', function() {

  it('create entities', function() {
    var a = crud.entity('/users'),
        b = crud.entity('/users'),
        c = crud.entity('/another');

    a.must.equal(b);
    a.must.not.equal(c);
  });

  it('method - create', function() {
    var m = crud.entity('/users').Create();

    crud.entity('/users')._methods.post.must.equal(m);
    m._entity.must.equal(crud.entity('/users'));
    m._name.must.equal('create');
    m._method.must.equal('post');
    m._chain.must.eql([]);
  });

  it('method - read', function() {
    var m = crud.entity('/users').Read();

    crud.entity('/users')._methods.get.must.equal(m);
    m._entity.must.equal(crud.entity('/users'));
    m._name.must.equal('read');
    m._method.must.equal('get');
    m._chain.must.eql([]);
  });

  it('method - update', function() {
    var m = crud.entity('/users').Update();

    crud.entity('/users')._methods.put.must.equal(m);
    m._entity.must.equal(crud.entity('/users'));
    m._name.must.equal('update');
    m._method.must.equal('put');
    m._chain.must.eql([]);
  });

  it('method - delete', function() {
    var m = crud.entity('/users').Delete();

    crud.entity('/users')._methods['delete'].must.equal(m);
    m._entity.must.equal(crud.entity('/users'));
    m._name.must.equal('delete');
    m._method.must.equal('delete');
    m._chain.must.eql([]);
  });

  it('method-createcors', function() {
    var m = crud.entity('/users').Create(),
        hasCors = null;

    test.when('No cors', function() {})
      .then(function() {
        var x = m.__createCors(hasCors),
            nextCalled = false,
            next = function() {
              nextCalled = true;
            };

        x(null, null, next);
        nextCalled.must.be.true();
      })
      .when('Yes cors', function() {
        hasCors = true;
      })
      .then(function() {
        var x = m.__createCors(hasCors),
            nextCalled = false,
            next = function() {
              nextCalled = true;
            };

        x.bind({}, null, null, next)
         .must.throw();
        nextCalled.must.be.false();
      })
  });

  it('chaining', function() {
    var m = crud.entity('/users').Create(),
        context = '--context--',
        req = {
          query: '--query--',
          body: '--body--'
        },
        res = {
          set: function() { },
          status: function() { },
          json: function(d) {
            jsonRes = d;
          }
        },
        jsonRes;

    m.use(function(req, res, next) {
      req.must.be.equal(req);
      res.must.be.equal(res);
      this.must.be.equal(context);
      next();
    })
    .pipe(function(data, query, next) {
      this.request.must.equal(req);
      this.response.must.equal(res);
      this.entity.must.equal(crud.entity('/users'));
      this.method.must.equal(m);
      this.query.must.equal(req.query);
      this.data.must.equal(req.body);
      this.metadata.must.eql({});
      this.express.must.equal(context);
      this.close.must.be.a.function();
      data.must.equal(req.body);
      query.must.equal(req.query);
      next.must.be.a.function();
      next(null, '--new-data--', '--new-query--');
    })
    .use(function(req, res, next) {
      req.must.be.equal(req);
      res.must.be.equal(res);
      this.must.be.equal(context);
      next();
    })
    .pipe(function(data, query, next) {
      data.must.equal('--new-data--');
      query.must.equal('--new-query--');
      this.metadata = 'meta';
      next();
    });

    m._chain.length.must.equal(4);

    m.__launch({ post: post }, { base: '/test' });

    function post(route, timeout, corsFn, cb) {
      route.must.be.equal('/test/users');
      timeout.must.be.a.function();
      corsFn.must.be.a.function();
      cb.call(context, req, res);
      jsonRes.must.eql({
        data: '--new-data--',
        error: null,
        metadata: 'meta'
      });

      m._chain[1] = function(data, query, next) {
        next('--my-error-');
      };
      cb.call(context, req, res);
      jsonRes.error.must.equal('--my-error-');
    }

  });

});
