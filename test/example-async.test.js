'use strict'

const { test } = require('node:test')
const { rimrafSync } = require('rimraf')
const build = require('./example-async')

let fastify = null
let token = null

test.before(() => {
  rimrafSync('./authdb')
  fastify = build()
})

test.after(async () => {
  await fastify.close()
  rimrafSync('./authdb')
})

test('Route without auth', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'GET',
    url: '/no-auth'
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('Missing header', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'GET',
    url: '/auth',
    headers: {}
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: 'Missing token header',
      statusCode: 401
    })
    done()
  })
})

test('Register user', (t, done) => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/register',
    payload: {
      user: 'tomas',
      password: 'a-very-secure-one'
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.strictEqual(res.statusCode, 200)
    token = payload.token
    t.assert.strictEqual(typeof payload.token, 'string')
    done()
  })
})

test('Auth successful', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'GET',
    url: '/auth',
    headers: {
      auth: token
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('Auth successful (multiple)', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/auth-multiple',
    payload: {
      user: 'tomas',
      password: 'a-very-secure-one'
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('Auth not successful', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'GET',
    url: '/auth',
    headers: {
      auth: 'the winter is coming'
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: 'Token not valid',
      statusCode: 401
    })
    done()
  })
})

test('Auth not successful (multiple)', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/auth-multiple',
    payload: {
      user: 'tomas',
      password: 'wrong!'
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: 'Password not valid',
      statusCode: 401
    })
    done()
  })
})

test('Failure with explicit reply', (t, done) => {
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
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.strictEqual(res.statusCode, 401)
    t.assert.deepStrictEqual(payload, { error: 'Unauthorized' })
    done()
  })
})
