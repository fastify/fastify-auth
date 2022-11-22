'use strict'

const fp = require('fastify-plugin')
const reusify = require('reusify')

const DEFAULT_RELATION = 'or'

function fastifyAuth (fastify, opts, next) {
  if (opts.defaultRelation && opts.defaultRelation !== 'or' && opts.defaultRelation !== 'and') {
    return next(new Error("The value of default relation should be one of ['or', 'and']"))
  } else if (!opts.defaultRelation) {
    opts.defaultRelation = DEFAULT_RELATION
  }

  fastify.decorate('auth', auth(opts))
  next()
}

function auth (pluginOptions) {
  return function (functions, opts) {
    if (!Array.isArray(functions)) {
      throw new Error('You must give an array of functions to the auth function')
    }
    if (!functions.length) {
      throw new Error('Missing auth functions')
    }

    const options = Object.assign({
      relation: pluginOptions.defaultRelation,
      run: null
    }, opts)

    if (options.relation !== 'or' && options.relation !== 'and') {
      throw new Error('The value of options.relation should be one of [\'or\', \'and\']')
    }
    if (options.run && options.run !== 'all') {
      throw new Error('The value of options.run must be \'all\'')
    }

    /* eslint-disable-next-line no-var */
    for (var i = 0; i < functions.length; i++) {
      functions[i] = functions[i].bind(this)
    }

    const instance = reusify(Auth)

    function _auth (request, reply, done) {
      const obj = instance.get()

      obj.request = request
      obj.reply = reply
      obj.done = done
      obj.functions = this.functions
      obj.options = this.options
      obj.i = 0
      obj.start = true
      obj.firstResult = null

      obj.nextAuth()
    }

    return _auth.bind({ functions, options })

    function Auth () {
      this.next = null
      this.i = 0
      this.start = true
      this.functions = []
      this.options = {}
      this.request = null
      this.reply = null
      this.done = null
      this.firstResult = null

      const that = this

      this.nextAuth = function nextAuth (err) {
        const func = that.functions[that.i++]

        if (!func) {
          that.completeAuth(err)
          return
        }

        try {
          const maybePromise = func(that.request, that.reply, that.onAuth)

          if (maybePromise && typeof maybePromise.then === 'function') {
            maybePromise.then(results => that.onAuth(null, results), that.onAuth)
          }
        } catch (err) {
          this.onAuth(err)
        }
      }

      this.onAuth = function onAuth (err, results) {
        if (that.options.relation === 'or') {
          if (err) {
            return that.nextAuth(err)
          }

          return that.completeAuth()
        } else {
          if (err) {
            return that.completeAuth(err)
          }

          return that.nextAuth(err)
        }
      }

      this.completeAuth = function (err) {
        if (that.start) {
          that.start = false
          that.firstResult = err
        }

        if (that.options.run === 'all' && that.i < that.functions.length) {
          return that.nextAuth(err)
        }

        if (that.firstResult && (!that.reply.raw.statusCode || that.reply.raw.statusCode < 400)) {
          that.reply.code(401)
        } else if (!that.firstResult && that.reply.raw.statusCode && that.reply.raw.statusCode >= 400) {
          that.reply.code(200)
        }

        that.done(that.firstResult)
        instance.release(that)
      }
    }
  }
}

module.exports = fp(fastifyAuth, {
  fastify: '4.x',
  name: '@fastify/auth'
})
module.exports.default = fastifyAuth
module.exports.fastifyAuth = fastifyAuth
