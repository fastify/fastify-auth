'use strict'
/*
Register a user:

    curl -i 'http://127.0.0.1:3000/register' -H 'content-type: application/json' --data '{"user": "myuser","password":"mypass"}'
Will return:
    {"token":"YOUR_JWT_TOKEN"}

The application then:
1. generates a JWT token (from 'supersecret') and adds to the response headers
1. inserts user in the leveldb

Check it's all working by using one or the other auth mechanisms:
1. Auth using username and password (you can also use JWT on this endpoint)
    curl 'http://127.0.0.1:3000/auth-multiple' -H 'content-type: application/json' --data '{"user": "myuser","password":"mypass"}'
    {"hello":"world"}

1. Auth using JWT token
    curl -i 'http://127.0.0.1:3000/auth' -H 'content-type: application/json' -H "auth: YOUR_JWT_TOKEN"
 */

const Fastify = require('fastify')

function build (opts) {
  const fastify = Fastify(opts)

  fastify.register(require('fastify-jwt'), { secret: 'supersecret' })
  fastify.register(require('fastify-leveldb'), { name: 'authdb' })
  fastify.register(require('./auth')) // just 'fastify-auth' IRL
  fastify.after(routes)

  fastify.decorate('verifyJWTandLevelDB', verifyJWTandLevelDB)
  fastify.decorate('verifyUserAndPassword', verifyUserAndPassword)

  function verifyJWTandLevelDB (request, reply, done) {
    const jwt = this.jwt
    const level = this.level.authdb

    if (request.body && request.body.failureWithReply) {
      reply.code(401).send({ error: 'Unauthorized' })
      return done(new Error())
    }

    if (!request.raw.headers.auth) {
      return done(new Error('Missing token header'))
    }

    jwt.verify(request.raw.headers.auth, onVerify)

    function onVerify (err, decoded) {
      if (err || !decoded.user || !decoded.password) {
        return done(new Error('Token not valid'))
      }

      level.get(decoded.user, onUser)

      function onUser (err, password) {
        if (err) {
          if (err.notFound) {
            return done(new Error('Token not valid'))
          }
          return done(err)
        }

        if (!password || password !== decoded.password) {
          return done(new Error('Token not valid'))
        }

        done()
      }
    }
  }

  function verifyUserAndPassword (request, reply, done) {
    const level = this.level.authdb

    if (!request.body || !request.body.user) {
      return done(new Error('Missing user in request body'))
    }

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
        fastify.level.authdb.put(req.body.user, req.body.password, onPut)

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
      preHandler: fastify.auth([fastify.verifyJWTandLevelDB]),
      handler: (req, reply) => {
        req.log.info('Auth route')
        reply.send({ hello: 'world' })
      }
    })

    fastify.route({
      method: 'POST',
      url: '/auth-multiple',
      preHandler: fastify.auth([
        // Only one of these has to pass
        fastify.verifyJWTandLevelDB,
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
    console.log(`Server listening at http://localhost:${fastify.server.address().port}`)
  })
}

module.exports = build
