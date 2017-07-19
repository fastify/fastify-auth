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

  function _auth (request, reply, done) {
    var obj = this.instance.get()

    obj.request = request
    obj.reply = reply
    obj.done = done
    obj.functions = this.functions
    obj.i = 0
    obj.instance = this.instance

    obj.nextAuth()
  }

  return _auth.bind({ functions, instance: reusify(Auth) })
}

function Auth () {
  this.next = null
  this.i = 0
  this.functions = []
  this.request = null
  this.reply = null
  this.done = null
  this.instance = null

  var that = this

  this.nextAuth = function nextAuth (err) {
    var func = that.functions[that.i++]

    if (!func) {
      if (!that.reply.res.statusCode || that.reply.res.statusCode < 400) {
        that.reply.code(401)
      }

      that.instance.release(that)
      that.done(err)
      return
    }

    func(that.request, that.reply, that.onAuth)
  }

  this.onAuth = function onAuth (err) {
    if (err) {
      return that.nextAuth(err)
    }

    that.instance.release(that)
    return that.done()
  }
}

module.exports = fp(checkAuth, '>=0.13.1')
