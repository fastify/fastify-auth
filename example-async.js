'use strict'

const Fastify = require('fastify')

function build (opts) {
  const fastify = Fastify(opts)

  fastify.register(require('fastify-jwt'), { secret: 'supersecret' })
  fastify.register(require('fastify-leveldb'), { name: 'authdb-async' })
  fastify.register(require('./auth'))
  fastify.after(routes)

  fastify.decorate('verifyJWTandLevel', verifyJWTandLevel)
  fastify.decorate('verifyUserAndPassword', verifyUserAndPassword)

  function verifyJWTandLevel (request, reply) {
    const jwt = this.jwt
    const level = this.level['authdb-async']

    if (request.body && request.body.failureWithReply) {
      reply.code(401).send({ error: 'Unauthorized' })
      return Promise.reject(new Error())
    }

    if (!request.raw.headers.auth) {
      return Promise.reject(new Error('Missing token header'))
    }

    return new Promise(function (resolve, reject) {
      jwt.verify(request.raw.headers.auth, function (err, decoded) {
        if (err) { return reject(err) };
        resolve(decoded)
      })
    }).then(function (decoded) {
      return level.get(decoded.user)
        .then(function (password) {
          if (!password || password !== decoded.password) {
            throw new Error('Token not valid')
          }
        })
    }).catch(function (error) {
      request.log.error(error)
      throw new Error('Token not valid')
    })
  }

  function verifyUserAndPassword (request, reply, done) {
    const level = this.level['authdb-async']

    level.get(request.body.user, onUser)

    function onUser (err, password) {
      if (err) {
        if (err.notFound) {
          return done(new Error('Password not valid'))
        }
        return done(err)
      }

      if (!password || password !== request.body.password) {
        return done(new Error('Password not valid'))
      }

      done()
    }
  }

  function routes () {
    fastify.route({
      method: 'POST',
      url: '/register',
      schema: {
        body: {
          type: 'object',
          properties: {
            user: { type: 'string' },
            password: { type: 'string' }
          },
          required: ['user', 'password']
        }
      },
      handler: (req, reply) => {
        req.log.info('Creating new user')
        fastify.level['authdb-async'].put(req.body.user, req.body.password, onPut)

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
      preHandler: fastify.auth([fastify.verifyJWTandLevel]),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

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
