'use strict'

const Fastify = require('fastify')

function build (opts) {
  const fastify = Fastify(opts)

  fastify
    .register(require('fastify-jwt'), { secret: 'supersecret' })
    .register(require('./fastify-level'), { name: 'authdb' })
    .register(require('./fastify-auth'))
    .after(routes)

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
