'use strict'

const fp = require('fastify-plugin')
const reusify = require('reusify')

function checkAuth (fastify, opts, next) {
  fastify.decorate('auth', auth)
  next()
}

function auth (functions) {
  if (!Array.isArray(functions)) {
    throw new Error('You must give an array of functions to the auth function')
  }
  if (!functions.length) {
    throw new Error('Missing auth functions')
  }

  for (var i = 0; i < functions.length; i++) {
    functions[i] = functions[i].bind(this)
  }

  var instance = reusify(Auth)

  function _auth (request, reply, done) {
    var obj = instance.get()

    obj.request = request
    obj.reply = reply
    obj.done = done
    obj.functions = this.functions
    obj.i = 0

    obj.nextAuth()
  }

  return _auth.bind({ functions })

  function Auth () {
    this.next = null
    this.i = 0
    this.functions = []
    this.request = null
    this.reply = null
    this.done = null

    var that = this

    this.nextAuth = function nextAuth (err) {
      var func = that.functions[that.i++]

      if (!func) {
        if (!that.reply.res.statusCode || that.reply.res.statusCode < 400) {
          that.reply.code(401)
        }

        instance.release(that)
        that.done(err)
        return
      }

      var maybePromise = func(that.request, that.reply, that.onAuth)

     if (maybePromise && typeof maybePromise.then === 'function')
        maybePromise.then(that.onAuth).catch(that.onAuth)
      }
    }

    this.onAuth = function onAuth (err) {
      if (err) {
        return that.nextAuth(err)
      }

      instance.release(that)
      return that.done()
    }
  }
}

module.exports = fp(checkAuth, '>=0.13.1')
