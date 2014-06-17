var crud = module.exports = exports = require('crud')(),
    api = require('./api');

crud.entity('/users', { description: 'Test users description' })
    .create(crud.cb(api.users.create, {
      params: {
        username: { type: 'string' }
      },
      response: {
        username: { type: 'string' }
      }
    }))
    .retrieve(api.users)
    .update(api.users)
    .delete(api.users);
