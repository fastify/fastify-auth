'use strict'

const { test } = require('node:test')
const Fastify = require('fastify')
const fastifyAuth = require('../auth')

test('registering plugin with invalid default relation', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  fastify.register(fastifyAuth, { defaultRelation: 'auth' })

  fastify.ready((err) => {
    t.assert.ok(err)
    t.assert.strictEqual(err.message, 'The value of default relation should be one of [\'or\', \'and\']')
    done()
  })
})

test('Clean status code through auth pipeline', (t, done) => {
  t.plan(3)

  const app = Fastify()
  app.register(fastifyAuth)
    .after(() => {
      app.addHook('preHandler', app.auth([failWithCode('one', 501), failWithCode('two', 502)]))
      app.get('/', (req, res) => res.send(42))
    })

  app.inject({
    method: 'GET',
    url: '/',
    query: {
      name: 'two'
    }
  }, (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.payload, '42')
    t.assert.strictEqual(res.statusCode, 200)
    done()
  })
})

test('defaultRelation: used when relation not specified', async (t) => {
  t.plan(2)

  const app = Fastify()
  await app.register(fastifyAuth, { defaultRelation: 'or' })

  app.route({
    method: 'GET',
    url: '/welcome',
    preHandler: app.auth([successWithCode('one', 200), failWithCode('two', 502)]),
    handler: async (req, reply) => {
      console.log('fawzihandler1')
      await reply.send({ hello: 'welcome' })
    }
  })

  app.route({
    method: 'GET',
    url: '/bye',
    preHandler: app.auth([failWithCode('one', 503), successWithCode('two', 200)], { relation: 'or' }),
    handler: (req, reply) => {
      reply.send({ hello: 'bye' })
    }
  })

  const response = await app.inject({
    method: 'GET',
    url: '/welcome'
  })
  t.assert.strictEqual(response.statusCode, 502)

  const res = await app.inject({
    method: 'GET',
    url: '/bye',
    query: {
      name: 'two'
    }
  })
  t.assert.strictEqual(res.statusCode, 200)
})

test('Options: non-array functions input', (t, done) => {
  t.plan(4)

  const app = Fastify()
  app.register(fastifyAuth).after(() => {
    try {
      app.addHook('preHandler', app.auth('bogus'))
      app.get('/', (req, res) => res.send(42))
    } catch (error) {
      t.assert.ok(error)
      t.assert.strictEqual(error.message, 'You must give an array of functions to the auth function')
    }
  })

  app.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 404)
    done()
  })
})

test('Options: empty array functions input', (t, done) => {
  t.plan(4)

  const app = Fastify()
  app.register(fastifyAuth).after(() => {
    try {
      app.addHook('preHandler', app.auth([]))
      app.get('/', (req, res) => res.send(42))
    } catch (error) {
      t.assert.ok(error)
      t.assert.strictEqual(error.message, 'Missing auth functions')
    }
  })

  app.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 404)
    done()
  })
})

test('Options: faulty relation', (t, done) => {
  t.plan(4)

  const app = Fastify()
  app.register(fastifyAuth).after(() => {
    try {
      app.addHook('preHandler', app.auth([successWithCode('one', 201)], { relation: 'foo' }))
      app.get('/', (req, res) => res.send(42))
    } catch (error) {
      t.assert.ok(error)
      t.assert.strictEqual(error.message, 'The value of options.relation should be one of [\'or\', \'and\']')
    }
  })

  app.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 404)
    done()
  })
})

test('Options: faulty run', (t, done) => {
  t.plan(4)

  const app = Fastify()
  app.register(fastifyAuth).after(() => {
    try {
      app.addHook('preHandler', app.auth([successWithCode('one', 201)], { run: 'foo' }))
      app.get('/', (req, res) => res.send(42))
    } catch (error) {
      t.assert.ok(error)
      t.assert.strictEqual(error.message, 'The value of options.run must be \'all\'')
    }
  })

  app.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 404)
    done()
  })
})

test('Avoid status code overwriting', (t, done) => {
  t.plan(3)

  const app = Fastify()
  app.register(fastifyAuth)
    .after(() => {
      app.addHook('preHandler', app.auth([successWithCode('one', 201), successWithCode('two', 202)]))
      app.get('/', (req, res) => res.send(42))
    })

  app.inject({
    method: 'GET',
    url: '/',
    query: {
      name: 'two'
    }
  }, (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.payload, '42')
    t.assert.strictEqual(res.statusCode, 202)
    done()
  })
})

test('Last win when all failures', (t, done) => {
  t.plan(2)

  const app = Fastify()
  app.register(fastifyAuth)
    .after(() => {
      app.addHook('preHandler', app.auth([failWithCode('one', 501), failWithCode('two', 502)]))
      app.get('/', (req, res) => res.send(42))
    })

  app.inject({
    method: 'GET',
    url: '/',
    query: {
      name: 'three'
    }
  }, (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 502)
    done()
  })
})

test('First success win', (t, done) => {
  t.plan(2)

  const app = Fastify()
  app.register(fastifyAuth)
    .after(() => {
      app.addHook('preHandler', app.auth([successWithCode('one', 201), successWithCode('two', 202)]))
      app.get('/', (req, res) => res.send(42))
    })

  app.inject({
    method: 'GET',
    url: '/',
    query: {
      name: 'two'
    }
  }, (err, res) => {
    t.assert.ifError(err)
    t.assert.strictEqual(res.statusCode, 202)
    done()
  })
})

function failWithCode (id, status) {
  return function (request, reply, done) {
    if (request.query.name === id) {
      done()
    } else {
      reply.code(status)
      done(new Error('query ' + id))
    }
  }
}

function successWithCode (id, status) {
  return function (request, reply, done) {
    if (request.query.name === id) {
      reply.code(status)
      done()
    } else {
      done(new Error('query ' + id))
    }
  }
}
