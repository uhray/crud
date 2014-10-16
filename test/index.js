
var crud = require('../lib/crud.js'),
    express = require('express'),
    app = express();

app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());

crud.entity('/users').Read()
  .use(function(req, res, next) {
    next();
  })
  .pipe(function(data, query, cb) {
    console.log(this);
    cb();
  });

crud.launch(app);

app.listen(3000);
