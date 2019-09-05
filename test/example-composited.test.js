'use strict'

const t = require('tap')
const test = t.test
const build = require('../example-composited')

var fastify = null

t.tearDown(() => {
  fastify.close()
})

test('boot server', t => {
  t.plan(1)
  fastify = build()
  t.error(false)
})

test('And Relation sucess for single case', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singleand',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, { hello: 'world' })
  })
})

test('And Relation failed for single case', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singleand',
    payload: {
      n: 10
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not odd',
      statusCode: 401
    })
  })
})

test('Or Relation sucess for single case', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singleor',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, { hello: 'world' })
  })
})

test('Or Relation failed for single case', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singleor',
    payload: {
      n: 10
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not odd',
      statusCode: 401
    })
  })
})

test('And Relation failed for first check', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/checkand',
    payload: {
      n: 'tomas'
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, {
      error: 'Unauthorized',
      message: 'type of `n` is not `number`',
      statusCode: 401
    })
  })
})

test('And Relation failed for first check', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/checkand',
    payload: {
      m: 11
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, {
      error: 'Unauthorized',
      message: 'type of `n` is not `number`',
      statusCode: 401
    })
  })
})

test('And Relation failed for second check', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/checkand',
    payload: {
      n: 10
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not odd',
      statusCode: 401
    })
  })
})

test('And Relation success', t => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/checkand',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, { hello: 'world' })
    t.equal(res.statusCode, 200)
  })
})

test('Or Relation success under first case', t => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/checkor',
    payload: {
      n: 1
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, { hello: 'world' })
    t.equal(res.statusCode, 200)
  })
})

test('Or Relation success under second case', t => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/checkor',
    payload: {
      n: 200
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, { hello: 'world' })
    t.equal(res.statusCode, 200)
  })
})

test('Or Relation failed for both case', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/checkor',
    payload: {
      n: 90
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not big',
      statusCode: 401
    })
  })
})
/** **/
