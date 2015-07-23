CRUD API Creator Library
====

* [Backend](#backend) - for creating a REST API server
* [Frontend](#frontend) - for retrieving data from a REST API

## Backend

CRUD is a libary for assisting in **creating RESTful APIs that use [express](https://github.com/visionmedia/express)**. CRUD allows you to create entities on a route (say `/users`) and design create, read, update, and delete methods.

Install with `npm install node-crud`.


### Simple Example

```js

var crud = require('crud'),
    express = require('express'),
    app = express();

// set up some express middleware
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());

// Let's create our first Crud API route
crud.entity('/users').Read()
  .use(function(req, res, next) {
    // express middleware capability
    next();
  })
  .pipe(function(data, query, cb) {
    cb(null, [ { name: 'bobby tables' } ]);
  });

crud.launch(app);

app.listen(3000);
```

Since this is a `Read` -- or an HTTP GET request -- you could go to your browser and see 127.0.0.1:3000/api/users. It would respond with JSON:

```json
{"error":null,"data":[{"name":"bobby tables"}],"metadata":{}}
```


### API

<a name="launch" href="#launch">#</a> crud.<b>launch</b>(<i>app</i>)

Tells crud to launch the application and begin listening for the routes. The *app* is the required [Express](http://expressjs.com/) application for listening.

<a name="backend-configure" href="#backend-configure">#</a> crud.<b>configure</b>(<i>options</i>)

You can provide configurations to to the crud API. The *options* object is a key-value object that is merged onto the default configurations.

Options:

  * *cors* - `Boolean` (default=false) - whether to enable cross-site requests using the [cors](https://www.npmjs.org/package/cors) module. If truthy and not an object, it creates a configuration for [cors](https://www.npmjs.org/package/cors) that allows all origins to request cross-origin and allows credentials to be stored. If the configuration is an object, this object will be passed as the options to the [cors](https://www.npmjs.org/package/cors) middleware.
  * *base* - `String` (default='/api') - the base url route of the API. All routes will be nested after these. A common example of changing this would be to something like `'/api/v1'`.

<a name="entity" href="#entity">#</a> crud.<b>entity</b>(<i>route</i>)

Creates an entity on the provided API <i>route</i>. All API routes will be set on the express object at `/api/{route}`.

If you have already created an EntityObject for the same route, this will not create a new one but instead return the old one. This means the following:

```js
crud.entity('/users') === crud.entity('/users')  // ==> true
```

This returns an EntityObject, with these four methods:

  * EntityObject.<b>Create</b>() - listens for a POST request
  * EntityObject.<b>Read</b>() - listens for a GET request
  * EntityObject.<b>Update</b>() - listens for a PUT request
  * EntityObject.<b>Delete</b>() - listens for a DELETE request

Each of these methods returns a MethodObject with the following API:

### Method Object

Method objects can be retrieved like this:

```js
var method_obj = crud.entity('/users').Read();
```

All functions on the method object are chainable. The goal is to create a series of middleware functions that will get called with the GET, POST, PUT, or DELETE data/query (depending on whether it's a Create, Read, Update, or Delete). You can modify data and pass it down the chain.

#### Method Chain Types

<a name="method-use" href="#method-use">#</a> MethodObject.<b>use</b>(<i>fn</i>)

Here you can chain a middleware function with the same API as [Connect](https://github.com/senchalabs/connect). You should be able to place any normal connect middleware here.

The *fn* is the middleware, and it is called with (*request*, *response*, *next*) the same way it would be in Express.

<a name="method-pipe" href="#method-pipe">#</a> MethodObject.<b>pipe</b>(<i>fn</i>)

Here you can chain middleware with the Crud format. This is where the usefulness of Crud really comes into play. The *fn* is called with (*data*, *query*, *callback*):

  * *data* - Initially, this is the data object on the HTTP request, so it will be equivalent to *request.body* from an Express request. 

  * *query* - Initially, this is the query object on the HTTP request, so it will be equivalent to *request.query* from an Express request. (If the url is `/api/users?name=bobby`, then the query is `{ name: 'bobby' }`. **HOWEVER**, this is not actually just the same as *request.query*, because it has the *request.params* merged in as well. So, if you had `crud('/users/:_id').Read()` and the url was `/api/users/7?name=bobby`, then the query is actually `{name: 'bobby', _id: 7}`.

  * *callback* - After you are done, whether synchronously or asynchronously, you can call this callback. It expects any of the following information: (*error*, *data*, *query*, *metadata*). If you provide an error, the chaining will be stopped. If you provided a second argument, it overrides the *data* value for all future chained middleware. If you provide a third argument, it overrides the *query* value for all future chained middleware. A fourth argument overrides the *metadata*. If you pass nothing, it just keeps chaining without modifying anything.

Additionally, this `fn` is called with a pretty extensive `this` context:

  * *request* - The Express `request` object.

  * *response* - The Express `response` object.

  * *express* - The original Express middleware context

  * *entity* - This is the Crud entity. So if your route was `/users`, this would be equivalent to `crud.entity('/users')`.

  * *method* -  This is the Crud method. So if your route was `/users` and this was a `Read` method, this would be equivalent to `crud.entity('/users').Read()`.

  * *data* - This is the same as the *data* argument.

  * *query* - This is the same as the *query* argument.

  * *metadata* - This is the metadata that can be passed along.

  * *callback* - This is the same as the *callback* argument.

  * *close* - Function that will manually close the crud stream.


#### Method Chain Example

Just to show it in action, you could do the following:

```js
crud.entity('/users').Read()
    .use(auth_middleware('root'))
    .pipe(function(data, query, cb) {
      // find all users that match the query
      UserModel.find(query).exec(cb);
    })
    .pipe(function(data, query, cb) {
      // data is now the list of users retrieved
      console.log('Going to respond with these users: %j', data);
      cb(null, users);
    })
```

### Events

Crud emits some events along the way that can be listened to. Events can be listened to on the Entity, which will fire for all Methods, or on a specific Method.

So, for a method you can listen like this:

```js
crud.entity('/users').Read()
    .pipe(/* pipe to something or whatever */)
    .on('<event>', function() {
      // event is fired with arguments
    })
```

Or, for an Entity you can listen for events and it fires ALL methods:

```js
crud.entity('/users')
    .on('<event>', function() {
      // event is fired with arguments
    })
```

The only difference in the event is that the first argument for events listening on an Entity (all methods) is which method the event occured for. The value of this argument will be (`'create'`,`'read'`,`'update'`, or `'delete'`).

All other arguments are specific to the event.

Events:

  * `'open'` - When a new request is started. This is fired before any chaining occurs. Arguments: (`data`, `query`).

  * `'close'` - When a request has completed, the chaining is done, and the response has been sent. This is not called when there is an error. Arguments: (`data`).
 
  * `'error'` - When one of the chained functions calls with an error, and the error has been responded from the server. Arguments: (`error`).


### Debug

The Crud module has sprinkled some [debug](https://github.com/visionmedia/debug) messages throughout the module. If you wish to turn these on, run your sever with the environment variable `DEBUG=crud` set.


## Frontend

CRUD on the frontend is a library for **assisting in accessing a RESTful API**. CRUD allows you to create (c), read (r), update (u), delete (d) methods.

Install with `bower install crud`.

Then the file is located in [dist/crud.js](dist/crud.js).


### Simple Example

```js

// Read all users
crud('/users').read(function(e, users) {
  console.log('response', e || users);
});

// Read and update each user
crud('/users')
  .on('each', function(d, idx) {
    console.log('each', d, idx);
    console.log(this.data === d); // --> true
    console.log(this == crud('/users', d._id));  // --> true
    d.read_count++;  // change a value
    this.update(d);  // PUT an update on the api /users/{d._id}
  })
  .read();

// Update example
crud('/users', '53b705826000a64d08ae5f94');
  .update({
    name: 'JOE SCHMO'
  }, function(e, d) {
    console.log('updated', e || d);
  });


```

### Configure

You can configure the global crud object via `crud.configure`.

The current configuration is:

```js
config = {
  base: '/api',
  idGetter: '_id',
  protocol: '',
  credentials: false,
  getData: function(d) { return d && d.data; },
  getError: function(d) { return d && d.error; }
  getMetadata: function(d) { return d && d.metadata; }
};
```

* <i>base</i>: the base url to send queries to. If `'/api'`, then crud('/users') will send its GET, PUT, POST, DELETE requests to '/api/users'.

* <i>idGetter</i>: this is for getting the id of each datum if an array is returned. This is useful for `.each` or `.on('each')`.

* <i>protocol</i>: this allows you to to change the request protocol (`'http://'`, `'https://'`, etc). By default it posts to `'/api'`, so it will use the protocol the page is accessed through.

* <i>credentials</i>: this allows you to have cross-origin requests that store credentialed information. It's good for creating an app that accesses an API on another url.

* <i>getData</i>: after the response text is converted to JSON, it calls this function to find out the data part of the response.

* <i>getError</i>: after the response text is converted to JSON, it calls this function to find out the error part of the response.

* <i>getMetadata</i>: after the response text is converted to JSON, it calls this function to find out the metadata part of the response.

### API

#### Entity API

The API is really simple. Basically, you create an <b>EntityObject</b> with `crud('/path/to/entity')`. NOTE: all arguments are joined together via [crud-url](#crud-url).

If any of the arguments have query string (e.g. `crud('/users?sortBy=10', '?limit=10)`), the query strings will be joined together. It's important to realize that if you put a query string in the uri path, it will travel with this crud object forever (on updates, etc). So if you just want the query string for a read (for example) you need to put that in the read <i>params</i> (see just below here).

With an EntityObject, you have the following options:

<a name="eo-crud" href="#eo-crud">#</a> EntityObject.{<b>create,read,update,del</b>}([<i>params</i>, <i>callback</i>])

(or EntityObject.{c,r,u,d})

NOTE: del not delete for browser compatability with old browsers that discourage `delete`.

These commands are used to query the route.

* <i>params</i>: queries API with given params. For read, this will be appended to the URL as a query string. For the rest it will be data that is posted, put, etc.
* <i>callback</i>: callback function when query returns

> NOTE: in addition to invoking the callback, events will be emitted upon a response.

> NOTE: on the read query, the third argument to the callback will be metadata if provided

<a name="eo-path" href="#eo-path">#</a> EntityObject.<b>path</b>

EntityObject.path gives you the path for the created object.

<a name="eo-each" href="#eo-each">#</a> EntityObject.<b>each</b>(<i>fn</i>)

Will call the <i>fn</i> for each object in the EntityObject.data value.

The <i>fn</i> is called with (datum, idx). When the fn is called, the context is the context of the specific datum.

Example:

```js
crud('/users').read(function(e, users) {
  this.each(function(d, idx) {
    console.log(d === users[idx]);  // --> true
    console.log(this == crud('/users', d._id));  // --> true
    console.log(this.path == crud('/users', d._id).path);  // --> true
    console.log(this.path == '/users' + d._id);  // --> true
  });
})

```

#### Utility Functions

Everything stems from the [entity-api], but we are working on utility functions to help making use of that api better.

  * [crud-parallel](#crud-parallel)
  * [crud-url](#crud-url)
  * [crud-create](#crud-create)
  * [crud-cursor](#crud-cursor)
  * [crud-cancelAll](#crud-cancelAll)

<a name="crud-parallel" href="#crud-parallel">#</a> crud.<b>parallel</b>(<i>object</i>, <i>callback</i>)

Runs a parallel read on the information queries provided in <i>object</i> and then call callback when done.

* <i>object</i>: a key-value object where the keys are names and the values are paths for urls.
* <i>callback</i>: callback function when parallel reads are done or when one returns with an error.

Example:

```js
crud.parallel({
  users: '/users',
  records: '/records&limit=10',
  posts: '/posts?sortBy=name:desc'
}, function(e, d) {
  // If everything is successful, the result will be:
  // { users: USER_RESPONSE, records: RECORDS_RESPONSE, posts: POSTS_RESPONSE }
  // where USER_RESPONSE is the same as crud('/users').read(fn)

  // If there was en error, it will immediately call this function with e being the error
});
```

<a name="crud-url" href="#crud-url">#</a> crud.<b>url</b>(\*args)

This will create a url from the provided arguments. The default url is `'/'` and then any arguments get joined onto that.

Additionally, if an argument is an object, it will become part of the query string at the end of the url.

Example:

```
  crud.url('users', 7);  // => '/users/7'
  crud.url('users', { name: 'joe' });  // => '/users?name=joe'
  crud.url('users', { name: 'joe', age: 7 });  // => '/users?name=joe&age=7'
  crud.url('users', { date: { $lte: new Date() } });  // => '/users?date[$lte]=2015-05-29T15:46:13.303Z'
  crud.url('users', { age: { $in: [18, 19] } });  // => '/users?age[$in][0]=18&age[$in][1]=18
```

This can be really useful in conjunction with [crud.parallel](#crud-parallel):

```
  crud.parallel({
    users: crud.url('/api/users', { age: 7 })
    themes: crud.url('/api/themes', { date: { $lte: 7 } } })
  }, function(e, d) {
    console.log(e || d);
  });
```

<a name="crud-create" href="#crud-create">#</a> crud.<b>create</b>(cfg)

Creates a new instance of crud, which can be configured differently than the default instance.

* <i>cfg</i>: Configuration options passed to [crud-configure](#configure).

<a name="crud-cursor" href="#crud-cursor">#</a> crud.<b>cursor</b>(*url, [perPage=100, page]*)

Creates a read cursor that is good for pagination.

Args:

  * *url* - `Required` - this is the URL to do a read (or `GET`) query on. Use [crud.url](#crud-url) if you need.
  * *perPage* - `Default = 100` - the number of records per page.
  * *page* - `Default = 0` - the start page.

Return Value: The return value is an object with two functions.

  * value.**next**(*cb*) - Queries the next page. The first time this is called, it will query the *page* argument. The *cb* gets called with `(error, data, metadata`).
  * value.**previous**(*cb*) - Queries the next page. The first time this is called, it will query the *page* argument. The *cb* gets called with `(error, data, metadata`).

Per the above callbacks, metadata is structured like this:

```json
{
    "records": 34666,
    "page": 0,
    "totalPages": 347,
    "perPage": 100
}
```

Example of cursor:

```js
var c = crud.cursor('/api/pds', 100);

c.next(function(e, d, m) {
  console.log('%d pds', d.length);
  console.log('meta', m);
  c.next(function(e, d, m) {
    console.log('%d pds', d.length);
    console.log('meta', m);
    c.previous(function(e, d, m) {
      console.log('%d pds', d.length);
      console.log('meta', m);
    });
  });
});
```

<a name="crud-cancelAll" href="#crud-cancelAll">#</a> crud.<b>cancelAll</b>()

Cancels all open crud requests. They will not call any callbacks and will not emit any events.

### Events

The following events can be listened to via normal event emitters: `.on(event, fn)` or `.once(event, fn)`

* create: emitted on a successful create. Arguments: (<i>data</i>).

* read: emitted on a successful read. Arguments: (<i>data</i>).

* update: emitted on a successful update. Arguments: (<i>data</i>).

* delete: emitted on a successful delete. Arguments: (<i>data</i>).

* each: emitted on a successful read that receives an array. The Arguments are the same as the [EntityObject.each](#eo-each) fn call. For a read that returns an array, it is called for each value.

