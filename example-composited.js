'use strict'

const Fastify = require('fastify')

function build (opts) {
  const fastify = Fastify(opts)

  fastify
    .register(require('./fastify-auth'))
    .after(routes)

  fastify.decorate('verifyNumber', verifyNumber)
  fastify.decorate('verifyOdd', verifyOdd)
  fastify.decorate('verifyBig', verifyBig)

  function verifyNumber (request, reply, done) {
    const n = request.body['n']

    if (typeof (n) !== 'number') {
      return done(new Error('type of `n` is not `number`'))
    }

    return done()
  }

  function verifyOdd (request, reply, done) {
    const n = request.body['n']

    if (n % 2 === 0) {
      return done(new Error('`n` is not odd'))
    }

    return done()
  }

  function verifyBig (request, reply, done) {
    const n = request.body['n']

    if (n < 100) {
      return done(new Error('`n` is not big'))
    }

    return done()
  }

  function routes () {
    fastify.route({
      method: 'GET',
      url: '/',
      handler: (req, reply) => {
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/checkand',
      preHandler: fastify.auth([fastify.verifyNumber, fastify.verifyOdd], { relation: 'and' }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/checkor',
      preHandler: fastify.auth([fastify.verifyOdd, fastify.verifyBig]),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/singleor',
      preHandler: fastify.auth([fastify.verifyOdd]),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/singleand',
      preHandler: fastify.auth([fastify.verifyOdd], { relation: 'and' }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })
  }

  return fastify
}

if (require.main === module) {
  const fastify = build({
    logger: {
      level: 'info'
    }
  })
  fastify.listen(3000, '0.0.0.0', err => {
    if (err) throw err
    console.log(`Server listenting at http://${JSON.stringify(fastify.server.address())}`)
  })
}

module.exports = build
