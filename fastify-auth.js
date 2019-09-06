'use strict'

const fp = require('fastify-plugin')
const reusify = require('reusify')

function checkAuth (fastify, opts, next) {
  fastify.decorate('auth', auth)
  next()
}

function auth (functions, options) {
  if (!Array.isArray(functions)) {
    throw new Error('You must give an array of functions to the auth function')
  }
  if (!functions.length) {
    throw new Error('Missing auth functions')
  }
  if (options === undefined) {
    options = { relation: 'or' }
  } else if (options.relation === undefined) {
    options.relation = 'or'
  } else {
    if (options.relation !== 'or' && options.relation !== 'and') {
      throw new Error('The value of options.relation should be one of [\'or\', \'and\']')
    }
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
    obj.options = this.options
    obj.i = 0

    obj.nextAuth()
  }

  return _auth.bind({ functions, options })

  function Auth () {
    this.next = null
    this.i = 0
    this.functions = []
    this.options = {}
    this.request = null
    this.reply = null
    this.done = null

    var that = this

    this.nextAuth = function nextAuth (err) {
      var func = that.functions[that.i++]

      if (!func) {
        if (err && (!that.reply.res.statusCode || that.reply.res.statusCode < 400)) {
          that.reply.code(401)
        }

        instance.release(that)
        that.done(err)
        return
      }

      var maybePromise = func(that.request, that.reply, that.onAuth)

      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(results => that.onAuth(null, results), that.onAuth)
      }
    }

    this.onAuth = function onAuth (err, results) {
      if (that.options.relation === 'or') {
        if (err) {
          return that.nextAuth(err)
        }

        if (that.i > 0 && that.reply.res.statusCode && that.reply.res.statusCode >= 400) {
          that.reply.code(200)
        }
        instance.release(that)
        return that.done()
      } else {
        if (err) {
          instance.release(that)
          that.reply.code(401)
          return that.done(err)
        }

        return that.nextAuth(err)
      }
    }
  }
}

module.exports = fp(checkAuth, '>=0.13.1')
