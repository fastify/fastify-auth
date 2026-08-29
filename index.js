'use strict'

const fp = require('fastify-plugin')
const createAuthHandler = require('./lib/auth-handler')
const { ALLOWED_RELATIONS, DEFAULT_RELATION } = require('./lib/constants')

/**
 * @type {typeof import('./types/index').fastifyAuth}
 */
function fastifyAuth (fastify, opts, next) {
  const specifiedRelation = opts.defaultRelation
  if (specifiedRelation && !ALLOWED_RELATIONS.includes(specifiedRelation)) {
    const error = new Error(`The value of default relation should be one of [${ALLOWED_RELATIONS}], not "${specifiedRelation}"`)
    return next(error)
  }
  const pluginOptions = {
    defaultRelation: specifiedRelation || DEFAULT_RELATION
  }
  fastify.decorate('auth', createAuthHandler(pluginOptions))
  next()
}

module.exports = fp(fastifyAuth, {
  fastify: '5.x',
  name: '@fastify/auth'
})
module.exports.default = fastifyAuth
module.exports.fastifyAuth = fastifyAuth
