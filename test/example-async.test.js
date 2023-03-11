'use strict'

const t = require('tap')
const test = t.test
const { rimrafSync } = require('rimraf')
const build = require('./example-async')

let fastify = null
let token = null

t.before(() => {
  rimrafSync('./authdb')
  fastify = build()
})

t.teardown(async () => {
  await fastify.close()
  rimrafSync('./authdb')
})

test('Route without auth', t => {
  t.plan(2)

  fastify.inject({
    method: 'GET',
    url: '/no-auth'
  }, (err, res) => {
    t.error(err)
    const payload = JSON.parse(res.payload)
    t.same(payload, { hello: 'world' })
  })
})

test('Missing header', t => {
  t.plan(2)

  fastify.inject({
    method: 'GET',
    url: '/auth',
    headers: {}
  }, (err, res) => {
    t.error(err)
    const payload = JSON.parse(res.payload)
    t.same(payload, {
      error: 'Unauthorized',
      message: 'Missing token header',
      statusCode: 401
    })
  })
})

test('Register user', t => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/register',
    payload: {
      user: 'tomas',
      password: 'a-very-secure-one'
    }
  }, (err, res) => {
    t.error(err)
    const payload = JSON.parse(res.payload)
    t.equal(res.statusCode, 200)
    token = payload.token
    t.equal(typeof payload.token, 'string')
  })
})

test('Auth succesful', t => {
  t.plan(2)

  fastify.inject({
    method: 'GET',
    url: '/auth',
    headers: {
      auth: token
    }
  }, (err, res) => {
    t.error(err)
    const payload = JSON.parse(res.payload)
    t.same(payload, { hello: 'world' })
  })
})

test('Auth succesful (multiple)', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/auth-multiple',
    payload: {
      user: 'tomas',
      password: 'a-very-secure-one'
    }
  }, (err, res) => {
    t.error(err)
    const payload = JSON.parse(res.payload)
    t.same(payload, { hello: 'world' })
  })
})

test('Auth not succesful', t => {
  t.plan(2)

  fastify.inject({
    method: 'GET',
    url: '/auth',
    headers: {
      auth: 'the winter is coming'
    }
  }, (err, res) => {
    t.error(err)
    const payload = JSON.parse(res.payload)
    t.same(payload, {
      error: 'Unauthorized',
      message: 'Token not valid',
      statusCode: 401
    })
  })
})

test('Auth not succesful (multiple)', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/auth-multiple',
    payload: {
      user: 'tomas',
      password: 'wrong!'
    }
  }, (err, res) => {
    t.error(err)
    const payload = JSON.parse(res.payload)
    t.same(payload, {
      error: 'Unauthorized',
      message: 'Password not valid',
      statusCode: 401
    })
  })
})

test('Failure with explicit reply', t => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/auth-multiple',
    payload: {
      failureWithReply: true,
      user: 'tomas',
      password: 'wrong!'
    }
  }, (err, res) => {
    t.error(err)
    const payload = JSON.parse(res.payload)
    t.equal(res.statusCode, 401)
    t.same(payload, { error: 'Unauthorized' })
  })
})
