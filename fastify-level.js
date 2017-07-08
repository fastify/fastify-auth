'use strict'

const fp = require('fastify-plugin')
const level = require('level')

function levelPlugin (fastify, opts, next) {
  if (!opts.name) {
    return next(new Error('Missing database name'))
  }
  opts.options = opts.options || {}

  fastify
    .decorate('level', level(opts.name, opts.options))
    .addHook('onClose', close)

  next()
}

function close (fastify, done) {
  fastify.level.close(done)
}

module.exports = fp(levelPlugin, '>=0.13.1')
