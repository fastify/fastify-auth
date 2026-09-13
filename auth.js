'use strict'

const fp = require('fastify-plugin')
const reusify = require('reusify')

const DEFAULT_RELATION = 'or'

/** @type {typeof import('./types/index').fastifyAuth} */
function fastifyAuth (fastify, opts, next) {
  if (opts.defaultRelation && opts.defaultRelation !== 'or' && opts.defaultRelation !== 'and') {
    return next(new Error("The value of default relation should be one of ['or', 'and']"))
  }

  const pluginOptions = {
    defaultRelation: opts.defaultRelation || DEFAULT_RELATION
  }

  fastify.decorate('auth', auth(pluginOptions))
  next()
}

function treeCallback (funcs, predicate, accept, reject, decisiveAccept, earlyStop) {
  let i = 0
  const decisiveCallback = decisiveAccept ? accept : reject
  const earlyExit = earlyStop
    ? decisiveCallback
    : (...args) => {
        function exec () {
          const func = funcs[i]
          i += 1
          if (i <= funcs.length) {
            return predicate(func, exec, exec)
          } else {
            return decisiveCallback(...args)
          }
        }
        return exec()
      }
  function exec () {
    const func = funcs[i]
    i += 1
    if (i < funcs.length) {
      if (decisiveAccept) {
        return predicate(func, earlyExit, exec)
      } else {
        return predicate(func, exec, earlyExit)
      }
    } else {
      return predicate(func, accept, reject)
    }
  }
  return exec()
}

function someCallback (funcs, predicate, accept, reject, earlyStop) {
  if (funcs.length > 0) {
    return treeCallback(funcs, predicate, accept, reject, true, earlyStop)
  }
  return reject()
}

function everyCallback (funcs, predicate, accept, reject, earlyStop) {
  if (funcs.length > 0) {
    return treeCallback(funcs, predicate, accept, reject, false, earlyStop)
  }
  return accept()
}

function vectorPredicate (gate, predicate, earlyStop) {
  return function (func, accept, reject) {
    if (Array.isArray(func)) {
      return gate(func, predicate, accept, reject, earlyStop)
    } else {
      return predicate(func, accept, reject)
    }
  }
}

function orGate (funcs, predicate, accept, reject, earlyStop) {
  return someCallback(
    funcs, vectorPredicate(andGate, predicate, earlyStop),
    accept, reject, earlyStop
  )
}

function andGate (funcs, predicate, accept, reject, earlyStop) {
  return everyCallback(
    funcs, vectorPredicate(orGate, predicate, earlyStop),
    accept, reject, earlyStop
  )
}

/** @param {import('./types/index').FastifyAuthPluginOptions} pluginOptions */
function auth (pluginOptions) {
  return function (functions, opts) {
    if (!Array.isArray(functions)) {
      throw new TypeError('You must give an array of functions to the auth function')
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

    const bindall = (funcs) => {
      for (const [i, func] of funcs.entries()) {
        if (Array.isArray(func)) {
          bindall(funcs[i])
        } else {
          funcs[i] = func.bind(this)
        }
      }
    }
    bindall(functions)

    const instance = reusify(Auth)

    function _auth (request, reply, done) {
      const obj = instance.get()

      obj.request = request
      obj.reply = reply
      obj.done = done
      obj.functions = this.functions
      obj.options = this.options
      obj.doAuth()
    }

    return _auth.bind({ functions, options })

    function Auth () {
      this.functions = []
      this.options = {}
      this.request = null
      this.reply = null
      this.done = null

      const that = this

      this.doAuth = function doAuth () {
        const earlyStop = that.options.run !== 'all'
        const gate = that.options.relation === 'or' ? orGate : andGate
        return gate(
          that.functions,
          that.processAuth,
          that.acceptAuth,
          that.rejectAuth,
          earlyStop
        )
      }

      this.processAuth = function processAuth (func, accept, reject) {
        try {
          const maybePromise = func(that.request, that.reply, (err) => err ? reject(err) : accept())

          if (maybePromise && typeof maybePromise.then === 'function') {
            maybePromise.then(accept, reject)
          }
        } catch (err) {
          reject(err)
        }
      }

      this.rejectAuth = function rejectAuth (err) {
        if (!that.reply.raw.statusCode || that.reply.raw.statusCode < 400) {
          that.reply.code(401)
        }
        that.done(err || new Error('sentinel'))
        instance.release(that)
      }

      this.acceptAuth = function acceptAuth () {
        if (that.reply.raw.statusCode && that.reply.raw.statusCode >= 400) {
          that.reply.code(200)
        }
        that.done()
        instance.release(that)
      }
    }
  }
}

module.exports = fp(fastifyAuth, {
  fastify: '5.x',
  name: '@fastify/auth'
})
module.exports.default = fastifyAuth
module.exports.fastifyAuth = fastifyAuth
