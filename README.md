# @fastify/auth

![CI](https://github.com/fastify/fastify-auth/workflows/CI/badge.svg)
[![NPM version](https://img.shields.io/npm/v/@fastify/auth.svg?style=flat)](https://www.npmjs.com/package/@fastify/auth)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)

This module does not provide an authentication strategy, but it provides a very fast utility to handle authentication (and multiple strategies) in your routes, without adding overhead.  
Check out a complete example [here](test/example.js).

## Install
```
npm i @fastify/auth
```

## Usage
As said above, `@fastify/auth` does not provide an authentication strategy, so you must provide authentication strategies yourself, with a decorator or another plugin.

In the following example, you will find a very simple implementation that should help you understand how to use this module:
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
  .register(require('@fastify/auth'))
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

The default relationship of these customized authentication strategies is `or`, while we could also use `and`:
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
  .register(require('@fastify/auth'))
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

You can use the `defaultRelation` option while registering the plugin, to change the default `relation`:
```js
fastify.register(require('@fastify/auth'), { defaultRelation: 'and'} )
```

_For more examples, please check [`example-composited.js`](test/example-composited.js)_

This plugin support `callback` and `Promise` returned by the functions. Note that an `async` function **does not have** to call the `done` parameter, otherwise the route handler to which the auth methods are linked to [might be called multiple times](https://www.fastify.io/docs/latest/Hooks/#respond-to-a-request-from-a-hook):
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
  .register(require('@fastify/auth'))
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


Keep in mind that route definition should either be done as [a plugin](https://github.com/fastify/fastify/blob/master/docs/Plugins.md) or within an `.after()` callback.
For a complete example implementation, see [example.js](test/example.js).

`@fastify/auth` will run all your authentication methods and your request will continue if at least one succeeds, otherwise it will return an error to the client.
Any successful authentication will automatically stop `@fastify/auth` from trying the rest, unless you provide the `run: 'all'` parameter:
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


You can use this plugin on route level as in the above example or on hook level by using the `preHandler` hook:
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

## API

### Options

*@fastify/auth* accepts the options object:

```js
{
  defaultRelation: 'and'
}
```

+ `defaultRelation` (Default: `or`): The default relation between the functions. It can be either `or` or `and`.

## Acknowledgements

This project is kindly sponsored by:
- [LetzDoIt](https://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).
