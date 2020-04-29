# fastify-auth

![CI](https://github.com/fastify/fastify-auth/workflows/CI/badge.svg)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)  

This module does not provide an authentication strategy, but it provides a very fast utility to handle authentication (also multiple strategies) in your routes, without adding overhead.  
Check out the complete example [here](https://github.com/fastify/fastify-auth/blob/master/example.js).

## Install
```
npm i fastify-auth
```

## Usage
As said above, `fastify-auth` does not provide an authentication strategy, so you must provide authentication by yourself, with a decorator or another plugin.
In the following example you will find a very simple implementation that should help you understand how to use this module.  

```js
fastify
  .decorate('verifyJWTandLevel', function (request, reply, done) {
    // your validation logic
    done() // pass an error if the authentication fails
  })
  .decorate('verifyUserAndPassword', function (request, reply, done) {
    // your validation logic
    done() // pass an error if the authentication fails
  })
  .register(require('fastify-auth'))
  .after(() => {
    fastify.route({
      method: 'POST',
      url: '/auth-multiple',
      preHandler: fastify.auth([
        fastify.verifyJWTandLevel,
        fastify.verifyUserAndPassword
      ]),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })
  })
```

And the default relationship of these customized authentication is `or`, while we could also use `and`. for eg
```js
fastify
  .decorate('verifyAdmin', function (request, reply, done) {
    // your validation logic
    done() // pass an error if the authentication fails
  })
  .decorate('verifyReputation', function (request, reply, done) {
    // your validation logic
    done() // pass an error if the authentication fails
  })
  .register(require('fastify-auth'))
  .after(() => {
    fastify.route({
      method: 'POST',
      url: '/auth-multiple',
      preHandler: fastify.auth([
        fastify.verifyAdmin,
        fastify.verifyReputation
      ], {
        relation: 'and'
      }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })
  })
```
_For more examples, please check `example-composited.js`_

This plugin support `callback` and `Promise` returned by the functions. Note that an `async` function doesn't have to use the `done` parameter:

```js
fastify
  .decorate('asyncVerifyJWTandLevel', async function (request, reply) {
    // your async validation logic
    await validation()
    // throws an error if the authentication fails
  })
  .decorate('asyncVerifyUserAndPassword', function (request, reply) {
    // return a promise that throws an error if the authentication fails
    return myPromiseValidation()
  })
  .register(require('fastify-auth'))
  .after(() => {
    fastify.route({
      method: 'POST',
      url: '/auth-multiple',
      preHandler: fastify.auth([
        fastify.asyncVerifyJWTandLevel,
        fastify.asyncVerifyUserAndPassword
      ]),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })
  })
```


Keep in mind that route definition should either be done as [a plugin](https://github.com/fastify/fastify/blob/master/docs/Plugins.md) or within `.after()` callback.
For complete example implementation see [example.js](example.js).

`fastify-auth` will run all your authentication methods and your request will continue if at least one succeds, otherwise it will return an error to the client.
Any successful authentication will automatically stop `fastify-auth` from trying the rest, unless you provide the `run: 'all'` parameter:

```js
fastify.route({
  method: 'GET',
  url: '/run-all',
  preHandler: fastify.auth([
    (request, reply, done) => { console.log('executed 1'); done() },
    (request, reply, done) => { console.log('executed 2'); done() },
    (request, reply, done) => { console.log('executed 3'); done(new Error('you are not authenticated')) },
    (request, reply, done) => { console.log('executed 4'); done() },
    (request, reply, done) => { console.log('executed 5'); done(new Error('you shall not pass')) }
  ], { run: 'all' }),
  handler: (req, reply) => { reply.send({ hello: 'world' }) }
})
```
This example will show all the console logs and will reply always with `401: you are not authenticated`.
The `run` parameter is useful if you are adding to the request business data read from auth-tokens.


You can use this plugin on route level, as in the above example or on hook level, by using the `preHandler` hook:
```js
fastify.addHook('preHandler', fastify.auth([
  fastify.verifyJWTandLevel,
  fastify.verifyUserAndPassword
]))

fastify.route({
  method: 'POST',
  url: '/auth-multiple',
  handler: (req, reply) => {
    req.log.info('Auth route')
    reply.send({ hello: 'world' })
  }
})
```

The difference between the two approaches is that if you use the route level `preHandler` function the authentication will run just for the selected route. Whereas if you use the `preHandler` hook the authentication will run for all the routes declared inside the current plugin (and its descendants).

## Acknowledgements

This project is kindly sponsored by:
- [LetzDoIt](http://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).
