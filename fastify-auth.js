'use strict'

const fp = require('fastify-plugin')

function checkAuth (fastify, opts, next) {
  fastify.decorate('auth', auth)
  next()

  function auth (request, reply, done) {
    var functions = reply.store.auth
    var i = 0

    if (functions === 0) {
      done(new Error('no auth function specified'))
      return
    }

    nextAuth()

    // TODO recycle this function
    function nextAuth () {
      var func = functions[i++]

      if (!func) {
        done()
        return
      }

      func.call(this, request, reply, onAuth)
    }

    // TODO recycle this function
    function onAuth (err, ok, msg) {
      if (err) {
        done(err)
        return
      }

      if (!ok) {
        // TODO how do we render HTML here?
        reply.code(401)
        // TODO we should not create an Error here
        done(new Error(msg || 'not authorized'))
        return
      }

      nextAuth()
    }
  }
}

module.exports = fp(checkAuth, '>=0.13.1')
