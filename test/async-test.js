'use strict'

const t = require('tap')
const test = t.test

const fastify = require('fastify')()

fastify
  .decorate('verifyJWTandLevel', function (request, reply) {
    return new Promise(function (resolve, reject) {
      if (request.body && request.body.failure) {
        reply.code(401).send({ 'error': 'Unauthorized' })
        reject(new Error())
      } else {
        resolve()
      }
    })
  })
  .register(require('../fastify-auth'))
  .after(() => {
    fastify.route({
      method: 'POST',
      url: '/fastify-auth',
      preHandler: fastify.auth([
        fastify.verifyJWTandLevel
      ]),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })
  })

test('Route with async auth: success', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/fastify-auth'
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, { hello: 'world' })
  })
})

test('Route with async auth: failure', t => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/fastify-auth',
    payload: {
      failure: true
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.equal(res.statusCode, 401)
    t.deepEqual(payload, { error: 'Unauthorized' })
  })
})
