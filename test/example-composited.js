'use strict'

const Fastify = require('fastify')

function build (opts) {
  const fastify = Fastify(opts)

  fastify
    .register(require('../auth'))
    .after(routes)

  fastify.decorate('verifyNumber', verifyNumber)
  fastify.decorate('verifyOdd', verifyOdd)
  fastify.decorate('verifyBig', verifyBig)
  fastify.decorate('verifyOddAsync', verifyOddAsync)
  fastify.decorate('verifyBigAsync', verifyBigAsync)

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

  function verifyOddAsync (request, reply) {
    request.verifyOddAsyncCalled = true
    return new Promise((resolve, reject) => {
      verifyOdd(request, reply, (err) => {
        if (err) reject(err)
        resolve()
      })
    })
  }

  function verifyBigAsync (request, reply) {
    request.verifyBigAsyncCalled = true
    return new Promise((resolve, reject) => {
      verifyBig(request, reply, (err) => {
        if (err) reject(err)
        resolve()
      })
    })
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
      url: '/checkarrayand',
      preHandler: fastify.auth([[fastify.verifyNumber], [fastify.verifyOdd]], { relation: 'and' }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/check-composite-and',
      preHandler: fastify.auth([fastify.verifyNumber, [fastify.verifyOdd, fastify.verifyBig]], { relation: 'and' }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/check-composite-and-async',
      preHandler: fastify.auth([fastify.verifyNumber, [fastify.verifyOddAsync, fastify.verifyBigAsync]], { relation: 'and' }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/check-composite-and-run-all',
      preHandler: fastify.auth([fastify.verifyNumber, [fastify.verifyOdd, fastify.verifyBig]], { relation: 'and', run: 'all' }),
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
      url: '/check-composite-or',
      preHandler: fastify.auth([fastify.verifyNumber, [fastify.verifyOdd, fastify.verifyBig]], { relation: 'or' }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/check-two-sub-arrays-or',
      preHandler: fastify.auth([[fastify.verifyBigAsync], [fastify.verifyOddAsync]], { relation: 'or' }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/check-two-sub-arrays-or-2',
      preHandler: fastify.auth([[fastify.verifyBigAsync], [fastify.verifyOddAsync]], { relation: 'or' }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({
          verifyBigAsyncCalled: !!req.verifyBigAsyncCalled,
          verifyOddAsyncCalled: !!req.verifyOddAsyncCalled
        })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/check-composite-or-async',
      preHandler: fastify.auth([fastify.verifyNumber, [fastify.verifyOddAsync, fastify.verifyBigAsync]], { relation: 'or' }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/check-composite-or-run-all',
      preHandler: fastify.auth([fastify.verifyNumber, [fastify.verifyOdd, fastify.verifyBig]], { relation: 'or', run: 'all' }),
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
      url: '/checkor',
      preHandler: fastify.auth([fastify.verifyOdd, fastify.verifyBig]),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/checkarrayor',
      preHandler: fastify.auth([[fastify.verifyOdd], [fastify.verifyBig]]),
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
      url: '/singlearrayor',
      preHandler: fastify.auth([[fastify.verifyOdd]]),
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
      url: '/singlearrayand',
      preHandler: fastify.auth([[fastify.verifyOdd]], { relation: 'and' }),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/singlearraycheckand',
      preHandler: fastify.auth([[fastify.verifyNumber, fastify.verifyOdd]]),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/checkarrayorsingle',
      preHandler: fastify.auth([[fastify.verifyNumber, fastify.verifyOdd], fastify.verifyBig]),
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
  fastify.listen({ port: 3000, host: '0.0.0.0' }, err => {
    if (err) throw err
  })
}

module.exports = build
