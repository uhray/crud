CRUD API Creator Library
====

CRUD is a libary for assisting in creating RESTful api that use [express](https://github.com/visionmedia/express). CRUD allows you to create entities on a route (/users) and add create (c), read (r), update (u), delete (d) methods.

Install with `npm install crud@git+ssh://git@github.com:uhray/crud.git`.


### Simple Example

```js
var crud = require('crud')(),
    express = require('express'),
    app = express();

crud.entity('/users')
    .c(create_user)
    .r(read_user)
    .u(update_user)
    .d(delete_user)

crud.launch(app);

function create_user(d, cb) {
  // do create user
  cb(null, true);
}

function read_user(d, cb) {
  // do get user
  cb(null, { username: 'example'});
}

function update_user(d, cb) {
  // do update user
  cb(null, true);
}

function delete_user(d, cb) {
  // do delete user
  cb(null, true);
}

```

### API

<a name="entity" href="#entity">#</a> crud.<b>entity</b>(<i>route</i>, [<i>options</i>])

Creates an entity on the provided api <i>route</i>. All api routes will be set on the express object at /api/{route}.

Options <i>options</i> object can be provided. Options:

* name: give a name to this entity. Used for [autodoc](#autodoc) purposes.
* description: give a description to this entity. Used for [autodoc](#autodoc) purposes.

Returns an entity object that follows a [fluent interface](http://en.wikipedia.org/wiki/Fluent_interface). The object is an EntityObject.

<a name="entity-c" href="#entity-c">#</a> EntityObject.<b>create</b>([<i>auth_middlware</i>], <i>callback</i>), EntityObject.<b>c</b>([<i>auth_middlware</i>], <i>callback</i>)

This will create a POST route for creating a new entity. Optionally, you can pass <i>auth_middlware</i> to restrict access to this route before the CRUD middleware takes over.

The <i>callback</i> will be called with four arguments:

* <i>datum</i> - this is the request body
* <i>callback</i> - the response callback function. It expects (<i>error</i>, <i>data</i>) and will respond with json formatted { error: error, data: data }.
* <i>request</i> - express request object
* <i>response</i> - express response object

<a name="entity-r" href="#entity-r">#</a> EntityObject.<b>read</b>([<i>auth_middlware</i>], <i>callback</i>), EntityObject.<b>r</b>([<i>auth_middlware</i>], <i>callback</i>)

This will create a GET route for creating a new entity. Optionally, you can pass <i>auth_middlware</i> to restrict access to this route before the CRUD middleware takes over.

The <i>callback</i> will be called with four arguments:

* <i>datum</i> - this is the request query
* <i>callback</i> - the response callback function. It expects (<i>error</i>, <i>data</i>) and will respond with json formatted { error: error, data: data }.
* <i>request</i> - express request object
* <i>response</i> - express response object

<a name="entity-u" href="#entity-u">#</a> EntityObject.<b>update</b>([<i>auth_middlware</i>], <i>callback</i>), EntityObject.<b>u</b>([<i>auth_middlware</i>], <i>callback</i>)

This will create a PUT route for creating a new entity. Optionally, you can pass <i>auth_middlware</i> to restrict access to this route before the CRUD middleware takes over.

The <i>callback</i> will be called with four arguments:

* <i>datum</i> - this is the request body
* <i>callback</i> - the response callback function. It expects (<i>error</i>, <i>data</i>) and will respond with json formatted { error: error, data: data }.
* <i>request</i> - express request object
* <i>response</i> - express response object

<a name="entity-d" href="#entity-d">#</a> EntityObject.<b>delete</b>([<i>auth_middlware</i>], <i>callback</i>), EntityObject.<b>d</b>([<i>auth_middlware</i>], <i>callback</i>)

This will create a DELETE route for creating a new entity. Optionally, you can pass <i>auth_middlware</i> to restrict access to this route before the CRUD middleware takes over.

The <i>callback</i> will be called with four arguments:

* <i>datum</i> - this is the request body
* <i>callback</i> - the response callback function. It expects (<i>error</i>, <i>data</i>) and will respond with json formatted { error: error, data: data }.
* <i>request</i> - express request object
* <i>response</i> - express response object

<a name="launch" href="#launch">#</a> crud.<b>launch</b>(<i>app</i>)

Launches all express routes on the express <i>app</i> object.

<a name="autodoc" href="#autodoc">#</a> crud.<b>autodoc</b>()

Console logs markdown documentation of the API.

NOTE: This is under construction.

<a name="cb" href="#cb">#</a> crud.<b>cb</b>(<i>callback</i>, [<i>options</i>])

The <i>callback</i> is the callback that will be called on this API route.

The <i>options</i> are as follows:
* params:
  This allows you to create a schema for the body (PUT, POST, DELETE routes) or the query (GET routes). This is useful so you don't have to parse the datum in all your callbacks. Also, this is used to help create autodocumentation.

  CRUD uses [jsonschema](https://github.com/tdegrunt/jsonschema) for parsing, so follow its format. If the schema validation fails, CRUD just provides a res.json response with an error so it never gets tothe callback.

  NOTE: right now, on GET routes the query response is on not converted to the schema format. All query data is in string format because it comes from the URL. In the future, I'd like to try to convert everything so you can actually get a number in the query datum instead of a string representation. so anything but `{ type: string }` will fail validation on a GET request.
* response:
  This allows you to specify the response schema. It's really useful for documentation. Crud uses [debug](https://github.com/visionmedia/debug), so when you run your server with environment variable `DEBUG=crud`, it will log a message if the response object is not correct.


