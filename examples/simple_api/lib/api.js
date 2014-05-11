var crud = require('crud'),
    api = module.exports = exports = {};


// api.users - retrieve all users
api.users = function(d, cb) {
  cb(null, []);
};

api.users.create = crud.cb({
  username: { type: 'string', description: 'username of new user',
              required: true }
}, function(d, cb) {
  cb(null, { username: d.username });
});

