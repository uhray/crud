
var crud = require('../lib/crud.js'),
    express = require('express'),
    app = express();

app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());

crud.entity('/users').Read()
  .use(function(req, res, next) {
    next();
  }).pipe(function(data, query, cb) {
    cb(null, [{ name: 'bobby tables' }]);
  }).pipe(function(data, query, cb) {
    cb();
  }).on('close', function(d) {
    console.log('CLOSED READ', d);
  }).on('error', function(d) {
    console.log('ERROR READ', d);
  });

crud.entity('/users')
    .on('open', function(method, data, query) {
      console.log('ENTITY OPENED: %s %j %j', method, data, query)
    })
    .on('close', function(method, data) {
      console.log('ENTITY CLOSED: %s %j', method, data)
    });

crud.launch(app);

app.listen(3000);
