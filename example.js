'use strict'

const Fastify = require('fastify')

function build (opts) {
  const fastify = Fastify(opts)

  fastify
    .register(require('fastify-jwt'), { secret: 'supersecret' })
    .register(require('fastify-leveldb'), { name: 'authdb' })
    .register(require('./fastify-auth'))
    .after(routes)

  fastify.decorate('verifyJWTandLevel', verifyJWTandLevel)

  function verifyJWTandLevel (request, reply, done) {
    const jwt = this.jwt
    const level = this.level

    if (!request.req.headers['auth']) {
      return done(null, false, 'Missing token header')
    }

    jwt.verify(request.req.headers['auth'], onVerify)

    function onVerify (err, decoded) {
      if (err || !decoded.user || !decoded.password) {
        return done(null, false, 'Token not valid')
      }

      level.get(decoded.user, onUser)

      function onUser (err, password) {
        if (err) {
          if (err.notFound) {
            return done(null, false, 'Token not valid')
          }
          return done(err)
        }

        if (!password || password !== decoded.password) {
          return done(null, false, 'Token not valid')
        }

        done(null, true)
      }
    }
  }

  function routes () {
    fastify.route({
      method: 'POST',
      url: '/register',
      schema: {
        body: {
          type: 'object',
          propertries: {
            user: { type: 'string' },
            password: { type: 'string' }
          },
          required: ['user', 'password']
        }
      },
      handler: (req, reply) => {
        req.log.info('Creating new user')
        fastify.level.put(req.body.user, req.body.password, onPut)

        function onPut (err) {
          if (err) return reply.send(err)
          fastify.jwt.sign(req.body, onToken)
        }

        function onToken (err, token) {
          if (err) return reply.send(err)
          req.log.info('User created')
          reply.send({ token })
        }
      }
    })

    fastify.route({
      method: 'GET',
      url: '/no-auth',
      handler: (req, reply) => {
        req.log.info('Auth free route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'GET',
      url: '/auth',
      auth: [fastify.verifyJWTandLevel.bind(fastify)],
      beforeHandler: fastify.auth.bind(fastify),
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
  fastify.listen(3000, err => {
    if (err) throw err
    console.log(`Server listenting at http://localhost:${fastify.server.address().port}`)
  })
}

module.exports = build
