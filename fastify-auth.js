'use strict'

const fp = require('fastify-plugin')

function checkAuth (fastify, opts, next) {
  if (!fastify.hasDecorator('jwt')) {
    return next(new Error('JWT decorator is not present'))
  }

  if (!fastify.hasDecorator('level')) {
    return next(new Error('level decorator is not present'))
  }

  fastify.decorate('auth', auth)
  next()
}

function auth (request, reply, done) {
  const { jwt, level } = this

  if (!request.req.headers['auth']) {
    reply.code(400)
    return done(new Error('Missing token header'))
  }

  jwt.verify(request.req.headers['auth'], onVerify)

  function onVerify (err, decoded) {
    if (err || !decoded.user || !decoded.password) {
      reply.code(401)
      return done(new Error('Token not valid'))
    }

    level.get(decoded.user, onUser)

    function onUser (err, password) {
      if (err) {
        if (err.notFound) {
          reply.code(401)
          return done(new Error('Token not valid'))
        }
        return done(err)
      }
      if (!password || password !== decoded.password) {
        reply.code(401)
        return done(new Error('Token not valid'))
      }

      done()
    }
  }
}

module.exports = fp(checkAuth, '>=0.13.1')
