
var crud = require('./index.js')(),
    express = require('express'),
    app = ga();

crud.entity('/users')
    .c(create_user)
    .r(create_user)
    .u(create_user)
    .d(create_user);

crud.launch(app);

function create_user(d, cb, req, res) {
  console.log(d);
  cb(null, true);
}

function ga() {
  var app = express();
  app.set('host', process.env.HOST || '127.0.0.1');
  app.set('view engine', 'jade');
  app.use(express.logger('dev'))
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(express.compress());
  app.listen(process.env.PORT || 3000);
  return app;
}
