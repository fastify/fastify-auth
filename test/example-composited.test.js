'use strict'

const { test } = require('node:test')
const build = require('./example-composited')

let fastify = null

test.after(async () => {
  await fastify.close()
})

test.before(() => {
  fastify = build()
})

test('And Relation success for single case', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singleand',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('And Relation failed for single case', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singleand',
    payload: {
      n: 10
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not odd',
      statusCode: 401
    })
    done()
  })
})

test('And Relation sucess for single [Array] case', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singlearrayand',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('And Relation failed for single [Array] case', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singlearrayand',
    payload: {
      n: 10
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not odd',
      statusCode: 401
    })
    done()
  })
})

test('Or Relation success for single case', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singleor',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('Or Relation failed for single case', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singleor',
    payload: {
      n: 10
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not odd',
      statusCode: 401
    })
    done()
  })
})

test('Or Relation success for single [Array] case', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singlearrayor',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('Or Relation failed for single [Array] case', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singlearrayor',
    payload: {
      n: 10
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not odd',
      statusCode: 401
    })
    done()
  })
})

test('And Relation failed for first check', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/checkand',
    payload: {
      n: 'tomas'
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: 'type of `n` is not `number`',
      statusCode: 401
    })
    done()
  })
})

test('And Relation failed for first check', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/checkand',
    payload: {
      m: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: 'type of `n` is not `number`',
      statusCode: 401
    })
    done()
  })
})

test('And Relation failed for second check', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/checkand',
    payload: {
      n: 10
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not odd',
      statusCode: 401
    })
    done()
  })
})

test('And Relation success', (t, done) => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/checkand',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    t.assert.strictEqual(res.statusCode, 200)
    done()
  })
})

test('[Array] notation And Relation success', (t, done) => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/checkarrayand',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    t.assert.strictEqual(res.statusCode, 200)
    done()
  })
})

test('And Relation with Or relation inside sub-array success', (t, done) => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/check-composite-and',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    t.assert.strictEqual(res.statusCode, 200)
    done()
  })
})

test('And Relation with Or relation inside sub-array failed', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/check-composite-and',
    payload: {
      n: 4
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not big',
      statusCode: 401
    })
    done()
  })
})

test('And Relation with Or relation inside sub-array with async functions success', (t, done) => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/check-composite-and-async',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    t.assert.strictEqual(res.statusCode, 200)
    done()
  })
})

test('And Relation with Or relation inside sub-array with async functions failed', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/check-composite-and-async',
    payload: {
      n: 4
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not big',
      statusCode: 401
    })
    done()
  })
})

test('Or Relation success under first case', (t, done) => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/checkor',
    payload: {
      n: 1
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    t.assert.strictEqual(res.statusCode, 200)
    done()
  })
})

test('[Array] notation Or Relation success under first case', (t, done) => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/checkarrayor',
    payload: {
      n: 1
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    t.assert.strictEqual(res.statusCode, 200)
    done()
  })
})

test('Or Relation success under second case', (t, done) => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/checkor',
    payload: {
      n: 200
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    t.assert.strictEqual(res.statusCode, 200)
    done()
  })
})

test('[Array] notation Or Relation success under second case', (t, done) => {
  t.plan(3)

  fastify.inject({
    method: 'POST',
    url: '/checkarrayor',
    payload: {
      n: 200
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    t.assert.strictEqual(res.statusCode, 200)
    done()
  })
})

test('Or Relation failed for both case', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/checkor',
    payload: {
      n: 90
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not big',
      statusCode: 401
    })
    done()
  })
})

test('[Array] notation Or Relation failed for both case', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/checkarrayor',
    payload: {
      n: 90
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not big',
      statusCode: 401
    })
    done()
  })
})

test('single [Array] And Relation success', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singlearraycheckand',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('single [Array] And Relation failed', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/singlearraycheckand',
    payload: {
      n: 10
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not odd',
      statusCode: 401
    })
    done()
  })
})

test('Two sub-arrays Or Relation success', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/check-two-sub-arrays-or',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('Two sub-arrays Or Relation called sequentially', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/check-two-sub-arrays-or-2',
    payload: {
      n: 110
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)

    t.assert.deepStrictEqual(payload, {
      verifyBigAsyncCalled: true,
      verifyOddAsyncCalled: false
    })
    done()
  })
})

test('Two sub-arrays Or Relation fail', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/check-two-sub-arrays-or',
    payload: {
      n: 4
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not odd',
      statusCode: 401
    })
    done()
  })
})

test('[Array] notation & single case Or Relation success under first case', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/checkarrayorsingle',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('[Array] notation & single case Or Relation success under second case', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/checkarrayorsingle',
    payload: {
      n: 1002
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('[Array] notation & single case Or Relation failed', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/checkarrayorsingle',
    payload: {
      n: 2
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: '`n` is not big',
      statusCode: 401
    })
    done()
  })
})

test('And Relation with Or relation inside sub-array with run: all', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/check-composite-and-run-all',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      odd: true,
      big: false,
      number: true
    })
    done()
  })
})

test('Or Relation with And relation inside sub-array with run: all', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/check-composite-or-run-all',
    payload: {
      n: 110
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      odd: false,
      big: true,
      number: true
    })
    done()
  })
})

test('Check run all line fail with AND', (t, done) => {
  t.plan(8)

  const fastify = build()

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/run-all-pipe',
      preHandler: fastify.auth([
        (request, reply, done) => { t.assert.ok('executed 1'); done() },
        (request, reply, done) => { t.assert.ok('executed 2'); done(new Error('second')) },
        (request, reply, done) => { t.assert.ok('executed 3'); done() },
        (request, reply, done) => { t.assert.ok('executed 4'); done() },
        (request, reply, done) => { t.assert.ok('executed 5'); done(new Error('fifth')) }
      ], { relation: 'and', run: 'all' }),
      handler: (req, reply) => { reply.send({ hello: 'world' }) }
    })
  })

  fastify.inject('/run-all-pipe', (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 401)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: 'second',
      statusCode: 401
    })
    done()
  })
})

test('Check run all line with AND', (t, done) => {
  t.plan(8)

  const fastify = build()

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/run-all-pipe',
      preHandler: fastify.auth([
        (request, reply, done) => { t.assert.ok('executed 1'); done() },
        (request, reply, done) => { t.assert.ok('executed 2'); done() },
        (request, reply, done) => { t.assert.ok('executed 3'); done() },
        (request, reply, done) => { t.assert.ok('executed 4'); done() },
        (request, reply, done) => { t.assert.ok('executed 5'); done() }
      ], { relation: 'and', run: 'all' }),
      handler: (req, reply) => { reply.send({ hello: 'world' }) }
    })
  })

  fastify.inject('/run-all-pipe', (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('Check run all line with OR', (t, done) => {
  t.plan(8)

  const fastify = build()

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/run-all-pipe',
      preHandler: fastify.auth([
        (req, reply, done) => { t.assert.ok('executed 1'); done(new Error('primo')) },
        (req, reply, done) => { t.assert.ok('executed 2'); done(new Error('secondo')) },
        (req, reply, done) => { t.assert.ok('executed 3'); done() },
        (req, reply, done) => { t.assert.ok('executed 4'); done(new Error('quarto')) },
        (req, reply, done) => { t.assert.ok('executed 5'); done() }
      ], { relation: 'or', run: 'all' }),
      handler: (req, reply) => { reply.send({ hello: 'world' }) }
    })
  })

  fastify.inject('/run-all-pipe', (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('Check run all fail line with OR', (t, done) => {
  t.plan(8)

  const fastify = build()

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/run-all-pipe',
      preHandler: fastify.auth([
        (req, reply, done) => { t.assert.ok('executed 1'); done(new Error('primo')) },
        (req, reply, done) => { t.assert.ok('executed 2'); done(new Error('secondo')) },
        (req, reply, done) => { t.assert.ok('executed 3'); done(new Error('terzo')) },
        (req, reply, done) => { t.assert.ok('executed 4'); done(new Error('quarto')) },
        (req, reply, done) => { t.assert.ok('executed 5'); done(new Error('quinto')) }
      ], { relation: 'or', run: 'all' }),
      handler: (req, reply) => { reply.send({ hello: 'world' }) }
    })
  })

  fastify.inject('/run-all-pipe', (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 401)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: 'quinto',
      statusCode: 401
    })
    done()
  })
})

test('Ignore last status', (t, done) => {
  t.plan(5)

  const fastify = build()

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/run-all-status',
      preHandler: fastify.auth([
        (req, reply, done) => { t.assert.ok('executed 1'); done() },
        (req, reply, done) => { t.assert.ok('executed 2'); done(new Error('last')) }
      ], { relation: 'or', run: 'all' }),
      handler: (req, reply) => { reply.send({ hello: 'world' }) }
    })
  })

  fastify.inject('/run-all-status', (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})

test('Or Relation run all', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/run-all-or',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      odd: true,
      big: false,
      number: true
    })
    done()
  })
})

test('Or Relation run all fail', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/run-all-or',
    payload: {
      n: 'foo'
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      error: 'Unauthorized',
      message: 'type of `n` is not `number`',
      statusCode: 401
    })
    done()
  })
})

test('Nested sub-arrays not supported', (t, done) => {
  t.plan(1)
  try {
    fastify.auth([[fastify.verifyBig, [fastify.verifyNumber]]])
  } catch (err) {
    t.assert.deepStrictEqual(err.message, 'Nesting sub-arrays is not supported')
    done()
  }
})

test('And Relation run all', (t, done) => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/run-all-and',
    payload: {
      n: 101
    }
  }, (err, res) => {
    t.assert.ifError(err)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, {
      odd: true,
      big: true,
      number: true
    })
    done()
  })
})

test('Clean status code settle by user', (t, done) => {
  t.plan(5)

  const fastify = build()

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/run-all-status',
      preHandler: fastify.auth([
        (req, reply, done) => { t.assert.ok('executed 1'); done() },
        (req, reply, done) => { t.assert.ok('executed 2'); reply.code(400); done(new Error('last')) }
      ], { relation: 'or', run: 'all' }),
      handler: (req, reply) => { reply.send({ hello: 'world' }) }
    })
  })

  fastify.inject('/run-all-status', (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 200)
    const payload = JSON.parse(res.payload)
    t.assert.deepStrictEqual(payload, { hello: 'world' })
    done()
  })
})
