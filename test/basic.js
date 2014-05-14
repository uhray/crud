
var crud = require('../index.js')(),
    cbax = require('cbax'),
    utools = require('utools'),
    express = require('express'),
    app = express();

crud.entity('/users')
    .c(crud.cb({
      username: { type: 'string', description: 'this is my description' }
    }, create_user))
    .r(create_user)
    .u(create_user)
    .d(create_user);

crud.launch(app);

function create_user(d, cb, req, res) {
  console.log('datum', d);
  cb(null, true);
}

