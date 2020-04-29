'use strict'

const Fastify = require('fastify')

function build (opts) {
  const fastify = Fastify(opts)

  fastify
    .register(require('./auth'))
    .after(routes)

  fastify.decorate('verifyNumber', verifyNumber)
  fastify.decorate('verifyOdd', verifyOdd)
  fastify.decorate('verifyBig', verifyBig)

  function verifyNumber (request, reply, done) {
    const n = request.body.n

    if (typeof (n) !== 'number') {
      request.number = false
      return done(new Error('type of `n` is not `number`'))
    }

    request.number = true
    return done()
  }

  function verifyOdd (request, reply, done) {
    const n = request.body.n

    if (typeof (n) !== 'number' || n % 2 === 0) {
      request.odd = false
      return done(new Error('`n` is not odd'))
    }

    request.odd = true
    return done()
  }

  function verifyBig (request, reply, done) {
    const n = request.body.n

    if (typeof (n) !== 'number' || n < 100) {
      request.big = false
      return done(new Error('`n` is not big'))
    }

    request.big = true
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

    fastify.route({
      method: 'POST',
      url: '/run-all-or',
      preHandler: fastify.auth([fastify.verifyOdd, fastify.verifyBig, fastify.verifyNumber], { run: 'all' }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({
          odd: req.odd,
          big: req.big,
          number: req.number
        })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/run-all-and',
      preHandler: fastify.auth([fastify.verifyOdd, fastify.verifyBig, fastify.verifyNumber], { run: 'all', relation: 'and' }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({
          odd: req.odd,
          big: req.big,
          number: req.number
        })
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
