# @fastify/auth

[![CI](https://github.com/fastify/fastify-auth/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/fastify/fastify-auth/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/@fastify/auth.svg?style=flat)](https://www.npmjs.com/package/@fastify/auth)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-brightgreen?style=flat)](https://github.com/neostandard/neostandard)

This module does not provide an authentication strategy but offers a fast utility to handle authentication and multiple strategies in routes without adding overhead.
See a complete example [here](test/example.js).

## Install
```
npm i @fastify/auth
```

### Compatibility
| Plugin version | Fastify version |
| ---------------|-----------------|
| `^5.x`         | `^5.x`          |
| `^3.x`         | `^4.x`          |
| `^1.x`         | `^3.x`          |
| `^0.x`         | `^2.x`          |
| `^0.x`         | `^1.x`          |


Please note that if a Fastify version is out of support, then so are the corresponding versions of this plugin
in the table above.
See [Fastify's LTS policy](https://github.com/fastify/fastify/blob/main/docs/Reference/LTS.md) for more details.

## Usage
`@fastify/auth` does not provide an authentication strategy; authentication strategies must be provided using a decorator or another plugin.

The following example provides a straightforward implementation to demonstrate the usage of this module:
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

The default relationship of these customized authentication strategies is `or`, but `and` can also be used:
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

For composite authentication, such as verifying user passwords and levels or meeting VIP criteria, use nested arrays.
For example, the logic [(verifyUserPassword `and` verifyLevel) `or` (verifyVIP)] can be achieved with the following code:
```js
fastify
  .decorate('verifyUserPassword', function (request, reply, done) {
    // your validation logic
    done() // pass an error if the authentication fails
  })
  .decorate('verifyLevel', function (request, reply, done) {
    // your validation logic
    done() // pass an error if the authentication fails
  })
  .decorate('verifyVIP', function (request, reply, done) {
    // your validation logic
    done() // pass an error if the authentication fails
  })
  .register(require('@fastify/auth'))
  .after(() => {
    fastify.route({
      method: 'POST',
      url: '/auth-multiple',
      preHandler: fastify.auth([
        [fastify.verifyUserPassword, fastify.verifyLevel], // The arrays within an array have the opposite relation to the main (default) relation.
        fastify.verifyVIP
      ], {
        relation: 'or' // default relation
      }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })
  })
```

If the `relation` (`defaultRelation`) parameter is `and`, then the relation inside sub-arrays will be `or`.
If the `relation` (`defaultRelation`) parameter is `or`, then the relation inside sub-arrays will be `and`.

| auth code        | resulting logical expression           |
| ------------- |:-------------:|
| `fastify.auth([f1, f2, [f3, f4]], { relation: 'or' })`  | `f1 OR f2 OR (f3 AND f4)` |
| `fastify.auth([f1, f2, [f3, f4]], { relation: 'and' })` | `f1 AND f2 AND (f3 OR f4)` |


The `defaultRelation` option can be used while registering the plugin to change the default `relation`:
```js
fastify.register(require('@fastify/auth'), { defaultRelation: 'and'} )
```

_For more examples, please check [`example-composited.js`](test/example-composited.js)_

This plugin supports `callback`s and `Promise`s returned by functions. Note that an `async` function **does not have** to call the `done` parameter, otherwise, the route handler linked to the auth methods [might be called multiple times](https://fastify.dev/docs/latest/Reference/Hooks/#respond-to-a-request-from-a-hook):
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


Route definition should be done as [a plugin](https://github.com/fastify/fastify/blob/master/docs/Reference/Plugins.md) or within an `.after()` callback. For a complete example, see [example.js](test/example.js).

`@fastify/auth` runs all authentication methods, allowing the request to continue if at least one succeeds; otherwise, it returns an error to the client.
Any successful authentication stops `@fastify/auth` from trying the rest unless the `run: 'all'` parameter is provided:
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
This example shows all console logs and always replies with `401: you are not authenticated`.
The `run` parameter is useful for adding business data read from auth tokens to the request.


This plugin can be used at the route level as in the above example or at the hook level using the `preHandler` hook:
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

The difference between the two approaches is that using the route-level `preHandler` function runs authentication for the selected route only, while using the `preHandler` hook runs authentication for all routes in the current plugin and its descendants.

## Security Considerations

### Hook selection

In the [Fastify Lifecycle](https://fastify.dev/docs/latest/Reference/Lifecycle/), the `onRequest` and `preParsing` stages do not parse the payload, unlike the `preHandler` stage. Parsing the body can be a potential security risk, as it can be used for denial of service (DoS) attacks. Therefore, it is recommended to avoid parsing the body for unauthorized access.

Using the `@fastify/auth` plugin in the `preHandler` hook can result in unnecessary memory allocation if a malicious user sends a large payload in the request body and the request is unauthorized. Fastify will parse the body, even though the request is not authorized, leading to unnecessary memory allocation. To avoid this, use an `onRequest` or `preParsing` hook for authentication if the method does not require the request body, such as `@fastify/jwt`, which expects authentication in the request header.

For authentication methods that require the request body, such as sending a token in the body, use the `preHandler` hook.

In mixed cases, you must use the `preHandler` hook.

## API

### Options

*@fastify/auth* accepts the options object:

```js
{
  defaultRelation: 'and'
}
```

+ `defaultRelation` (Default: `or`): The default relation between the functions. It can be either `or` or `and`.

## Acknowledgments

This project is kindly sponsored by:
- [LetzDoIt](https://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).
