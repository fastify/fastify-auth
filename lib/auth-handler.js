'use strict'

const reusify = require('reusify')
const AuthState = require('./auth-state')
const { ALLOWED_RELATIONS } = require('./constants')

/**
 * @param { import('../types/index').FastifyAuthPluginOptions } pluginOptions
 * @returns {(
 *   handlers: import('../types/index').FastifyAuthHandlerArray,
 *   authOptions?: import('../types/index').FastifyAuthOptions
 * ) => (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply, done: (error?: Error) => void) => void}
 */
function createAuthHandler (pluginOptions) {
  return function (handlers, authOptions) {
    if (!Array.isArray(handlers)) {
      throw new TypeError(`You must give an array of functions, not "${typeof handlers}"`)
    }
    if (!handlers.length) {
      throw new Error('Missing auth functions')
    }
    handlers.forEach((fn, i) => {
      if (!Array.isArray(fn)) {
        handlers[i] = fn.bind(this)
        return
      }
      fn.forEach((nestedFn, j) => {
        if (Array.isArray(nestedFn)) {
          throw new TypeError('Nesting sub-arrays is not supported')
        }
        fn[j] = nestedFn.bind(this)
      })
    })
    const instance = reusify(AuthState)
    const options = resolveAuthOptions(pluginOptions, authOptions)
    return createRequestHandler(instance, handlers, options)
  }
}

/**
 * @param {import('../types/index').FastifyAuthPluginOptions} pluginOptions
 * @param {import('../types/index').FastifyAuthOptions} authOptions
 * @returns {Required<import('../types/index').FastifyAuthOptions>}
 */
function resolveAuthOptions (pluginOptions, authOptions) {
  const resolvedOptions = {
    relation: pluginOptions.defaultRelation,
    run: null,
    ...authOptions
  }
  const { relation, run } = resolvedOptions
  if (!ALLOWED_RELATIONS.includes(relation)) {
    throw new Error(`The value of default relation should be one of [${ALLOWED_RELATIONS}], not "${relation}"`)
  }
  if (run && run !== 'all') {
    throw new Error(`The value of run option must be "all", not "${run}"`)
  }
  return resolvedOptions
}

/**
 * @param {{ get(): import('./auth-state'), release(obj: import('./auth-state')): void }} instance
 * @param {import('../types/index').FastifyAuthHandlerArray} handlers
 * @param {Required<import('../types/index').FastifyAuthOptions>} options
 * @returns {(request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply, done: (error?: Error) => void) => void}
 */
function createRequestHandler (instance, handlers, options) {
  return (request, reply, done) => {
    const state = instance.get()
    state.i = 0
    state.j = 0
    state.handlers = handlers
    state.options = options
    state.request = request
    state.reply = reply
    state.done = done
    state.currentError = null
    state.skipFurtherErrors = false
    state.skipFurtherArrayErrors = false
    state.onComplete = () => instance.release(state)
    state.nextAuthHandler()
  }
}

module.exports = createAuthHandler
module.exports.resolveAuthOptions = resolveAuthOptions
module.exports.createRequestHandler = createRequestHandler
