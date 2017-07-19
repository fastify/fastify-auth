'use strict'

const fp = require('fastify-plugin')

function checkAuth (fastify, opts, next) {
  fastify.decorate('auth', auth)
  next()

  function auth (functions) {
    if (!Array.isArray(functions)) {
      throw new Error('You must give an array of functions to the auth function')
    }
    if (!functions.length) {
      throw new Error('Missing auth functions')
    }

    function _auth (request, reply, done) {
      var functions = this.functions
      var i = 0

      nextAuth()

      // TODO recycle this function
      function nextAuth (err) {
        var func = functions[i++]

        if (!func) {
          if (!reply.res.statusCode || reply.res.statusCode < 400) {
            reply.code(401)
          }
          done(err)
          return
        }

        func(request, reply, onAuth)
      }

      // TODO recycle this function
      function onAuth (err) {
        if (err) {
          return nextAuth(err)
        }

        return done()
      }
    }

    return _auth.bind({ functions })
  }
}

module.exports = fp(checkAuth, '>=0.13.1')
