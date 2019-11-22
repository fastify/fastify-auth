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

test('Check run all line fail with AND', t => {
  t.plan(8)

  const fastify = build()

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/run-all-pipe',
      preHandler: fastify.auth([
        (request, reply, done) => { t.pass('executed 1'); done() },
        (request, reply, done) => { t.pass('executed 2'); done(new Error('second')) },
        (request, reply, done) => { t.pass('executed 3'); done() },
        (request, reply, done) => { t.pass('executed 4'); done() },
        (request, reply, done) => { t.pass('executed 5'); done(new Error('fifth')) }
      ], { relation: 'and', run: 'all' }),
      handler: (req, reply) => { reply.send({ hello: 'world' }) }
    })
  })

  fastify.inject('/run-all-pipe', (err, res) => {
    t.error(err)
    t.equals(res.statusCode, 401)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, {
      error: 'Unauthorized',
      message: 'second',
      statusCode: 401
    })
  })
})

test('Check run all line with AND', t => {
  t.plan(8)

  const fastify = build()

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/run-all-pipe',
      preHandler: fastify.auth([
        (request, reply, done) => { t.pass('executed 1'); done() },
        (request, reply, done) => { t.pass('executed 2'); done() },
        (request, reply, done) => { t.pass('executed 3'); done() },
        (request, reply, done) => { t.pass('executed 4'); done() },
        (request, reply, done) => { t.pass('executed 5'); done() }
      ], { relation: 'and', run: 'all' }),
      handler: (req, reply) => { reply.send({ hello: 'world' }) }
    })
  })

  fastify.inject('/run-all-pipe', (err, res) => {
    t.error(err)
    t.equals(res.statusCode, 200)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, { hello: 'world' })
  })
})

test('Check run all line with OR', t => {
  t.plan(8)

  const fastify = build()

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/run-all-pipe',
      preHandler: fastify.auth([
        (req, reply, done) => { t.pass('executed 1'); done(new Error('primo')) },
        (req, reply, done) => { t.pass('executed 2'); done(new Error('secondo')) },
        (req, reply, done) => { t.pass('executed 3'); done() },
        (req, reply, done) => { t.pass('executed 4'); done(new Error('quarto')) },
        (req, reply, done) => { t.pass('executed 5'); done() }
      ], { relation: 'or', run: 'all' }),
      handler: (req, reply) => { reply.send({ hello: 'world' }) }
    })
  })

  fastify.inject('/run-all-pipe', (err, res) => {
    t.error(err)
    t.equals(res.statusCode, 200)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, { hello: 'world' })
  })
})

test('Check run all fail line with OR', t => {
  t.plan(8)

  const fastify = build()

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/run-all-pipe',
      preHandler: fastify.auth([
        (req, reply, done) => { t.pass('executed 1'); done(new Error('primo')) },
        (req, reply, done) => { t.pass('executed 2'); done(new Error('secondo')) },
        (req, reply, done) => { t.pass('executed 3'); done(new Error('terzo')) },
        (req, reply, done) => { t.pass('executed 4'); done(new Error('quarto')) },
        (req, reply, done) => { t.pass('executed 5'); done(new Error('quinto')) }
      ], { relation: 'or', run: 'all' }),
      handler: (req, reply) => { reply.send({ hello: 'world' }) }
    })
  })

  fastify.inject('/run-all-pipe', (err, res) => {
    t.error(err)
    t.equals(res.statusCode, 401)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, {
      error: 'Unauthorized',
      message: 'quinto',
      statusCode: 401
    })
  })
})

test('Ignore last status', t => {
  t.plan(5)

  const fastify = build()

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/run-all-status',
      preHandler: fastify.auth([
        (req, reply, done) => { t.pass('executed 1'); done() },
        (req, reply, done) => { t.pass('executed 2'); done(new Error('last')) }
      ], { relation: 'or', run: 'all' }),
      handler: (req, reply) => { reply.send({ hello: 'world' }) }
    })
  })

  fastify.inject('/run-all-status', (err, res) => {
    t.error(err)
    t.equals(res.statusCode, 200)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, { hello: 'world' })
  })
})

test('Or Relation run all', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/run-all-or',
    payload: {
      n: 11
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, {
      odd: true,
      big: false,
      number: true
    })
  })
})

test('Or Relation run all fail', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/run-all-or',
    payload: {
      n: 'foo'
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

test('And Relation run all', t => {
  t.plan(2)

  fastify.inject({
    method: 'POST',
    url: '/run-all-and',
    payload: {
      n: 101
    }
  }, (err, res) => {
    t.error(err)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, {
      odd: true,
      big: true,
      number: true
    })
  })
})

test('Clean status code settle by user', t => {
  t.plan(5)

  const fastify = build()

  fastify.after(() => {
    fastify.route({
      method: 'GET',
      url: '/run-all-status',
      preHandler: fastify.auth([
        (req, reply, done) => { t.pass('executed 1'); done() },
        (req, reply, done) => { t.pass('executed 2'); reply.code(400); done(new Error('last')) }
      ], { relation: 'or', run: 'all' }),
      handler: (req, reply) => { reply.send({ hello: 'world' }) }
    })
  })

  fastify.inject('/run-all-status', (err, res) => {
    t.error(err)
    t.equals(res.statusCode, 200)
    var payload = JSON.parse(res.payload)
    t.deepEqual(payload, { hello: 'world' })
  })
})
