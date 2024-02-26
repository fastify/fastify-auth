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
      if (Array.isArray(functions[i]) === false) {
        functions[i] = functions[i].bind(this)
      } else {
        /* eslint-disable-next-line no-var */
        for (var j = 0; j < functions[i].length; j++) {
          if (Array.isArray(functions[i][j])) {
            throw new Error('Nesting sub-arrays is not supported')
          }
          functions[i][j] = functions[i][j].bind(this)
        }
      }
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
      obj.j = 0
      obj.currentError = null
      obj.skipFurtherErrors = false
      obj.skipFurtherArrayErrors = false

      obj.nextAuth()
    }

    return _auth.bind({ functions, options })

    function Auth () {
      this.next = null
      this.i = 0
      this.j = 0
      this.functions = []
      this.options = {}
      this.request = null
      this.reply = null
      this.done = null
      this.currentError = null
      this.skipFurtherErrors = false
      this.skipFurtherArrayErrors = false

      const that = this

      this.nextAuth = function nextAuth (err) {
        if (!that.skipFurtherErrors) that.currentError = err

        const func = that.functions[that.i++]
        if (!func) {
          return that.completeAuth()
        }

        if (!Array.isArray(func)) {
          that.processAuth(func, (err) => {
            if (that.options.run !== 'all') that.currentError = err

            if (that.options.relation === 'and') {
              if (err && that.options.run !== 'all') {
                that.completeAuth()
              } else {
                if (err && that.options.run === 'all' && !that.skipFurtherErrors) {
                  that.skipFurtherErrors = true
                  that.currentError = err
                }
                that.nextAuth(err)
              }
            } else {
              if (!err && that.options.run !== 'all') {
                that.completeAuth()
              } else {
                if (!err && that.options.run === 'all') {
                  that.skipFurtherErrors = true
                  that.currentError = null
                }
                that.nextAuth(err)
              }
            }
          })
        } else {
          that.j = 0
          that.skipFurtherArrayErrors = false
          that.processAuthArray(func, (err) => {
            if (that.options.relation === 'and') { // sub-array relation is OR
              if (!err && that.options.run !== 'all') {
                that.nextAuth(err)
              } else {
                that.currentError = err
                that.nextAuth(err)
              }
            } else { // sub-array relation is AND
              if (err && that.options.run !== 'all') {
                that.currentError = err
                that.nextAuth(err)
              } else {
                if (!err && that.options.run !== 'all') {
                  that.currentError = null
                  return that.completeAuth()
                }
                that.nextAuth(err)
              }
            }
          })
        }
      }

      this.processAuthArray = function processAuthArray (funcs, callback, err) {
        const func = funcs[that.j++]
        if (!func) return callback(err)

        that.processAuth(func, (err) => {
          if (that.options.relation === 'and') { // sub-array relation is OR
            if (!err && that.options.run !== 'all') {
              callback(err)
            } else {
              if (!err && that.options.run === 'all') {
                that.skipFurtherArrayErrors = true
              }
              that.processAuthArray(funcs, callback, that.skipFurtherArrayErrors ? null : err)
            }
          } else { // sub-array relation is AND
            if (err && that.options.run !== 'all') callback(err)
            else that.processAuthArray(funcs, callback, err)
          }
        })
      }

      this.processAuth = function processAuth (func, callback) {
        try {
          const maybePromise = func(that.request, that.reply, callback)

          if (maybePromise && typeof maybePromise.then === 'function') {
            maybePromise.then(() => callback(null), callback)
          }
        } catch (err) {
          callback(err)
        }
      }

      this.completeAuth = function () {
        if (that.currentError && (!that.reply.raw.statusCode || that.reply.raw.statusCode < 400)) {
          that.reply.code(401)
        } else if (!that.currentError && that.reply.raw.statusCode && that.reply.raw.statusCode >= 400) {
          that.reply.code(200)
        }

        that.done(that.currentError)
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
