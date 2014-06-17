
var crud = require('../index.js')(),
    cbax = require('cbax'),
    utools = require('utools'),
    express = require('express'),
    debug = require('debug')('api'),
    app = express();

crud.entity('/users')
    .c(crud.cb(create_user, {
      params: {
        username: { type: 'string', description: 'this is my description' }
      },
      response : {
        username: { type: 'string', description: 'this is my description' }
      }
    }))
    .r(crud.cb(create_user, {
      params: {
        username: { type: 'string', description: 'this is my description' }
      },
      response : {
        username: { type: 'string', description: 'this is my description' }
      }
    }))
    .u(create_user)
    .d(create_user);

crud.launch(app);

app.listen('3000', function() {
});


function create_user(d, cb, req, res) {
  cb(null, { username: 'bobby' });
}

