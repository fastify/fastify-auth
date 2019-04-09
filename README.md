# fastify-auth

[![Greenkeeper badge](https://badges.greenkeeper.io/fastify/fastify-auth.svg)](https://greenkeeper.io/)

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)  [![Build Status](https://travis-ci.org/fastify/fastify-auth.svg?branch=master)](https://travis-ci.org/fastify/fastify-auth)

This module does not provide an authentication strategy, but it provides a very fast utility to handle authentication (also multiple strategies) in your routes, without adding overhead.  
Check out the complete example [here](https://github.com/fastify/fastify-auth/blob/master/example.js).

## Install
```
npm i fastify-auth --save
```

## Usage
As said above, `fastify-auth` does not provide an authentication strategy, so you must provide authentication by yourself, with a decorator or another plugin.
In the following example you will find a very simple implementation that should help you understand how use this module.  
```js
fastify
  .decorate('verifyJWTandLevel', function (request, reply, done) {
    // your validation logic
    done() // pass an error if the authentication fails
  })
  .decorate('verifyUserAndPassword', async function (request, reply) {
    // your async validation logic
    await validation()
    // throws an error if the authentication fails
  })
  .register(require('fastify-auth'))
  .after(() => {
    fastify.route({
      method: 'POST',
      url: '/auth-multiple',
      beforeHandler: fastify.auth([
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

This plugin support `callback` and `Promise` returned by the functions. Note that an `async` function
doesn't have to use the `done` parameter.

Keep in mind that route definition should either be done as [a plugin](https://github.com/fastify/fastify/blob/master/docs/Plugins.md) or within `.after()` callback. For complete example implementation see [example.js](example.js).

`fastify-auth` will run all your authentication methods and your request will continue if at least one succeeds, otherwise it will return an error to the client. Any successful authentication will automatically stop `fastify-auth` from trying the rest.

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

The difference between the two approaches is that if you use the `beforeHandler` the authentication will run just for the selected route, while if you use the `preHandler` hook the authentication will run for all the routes declared inside the current plugin (and its sons).

## Acknowledgements

This project is kindly sponsored by:
- [LetzDoIt](http://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).
