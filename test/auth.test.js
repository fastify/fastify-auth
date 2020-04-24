'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const fastifyAuth = require('../auth')

test('Clean status code through auth pipeline', t => {
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
    t.error(err)
    t.equal(res.payload, '42')
    t.equal(res.statusCode, 200)
  })
})

test('Avoid status code overwriting', t => {
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
    t.error(err)
    t.equal(res.payload, '42')
    t.equal(res.statusCode, 202)
  })
})

test('Last win when all failures', t => {
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
    t.error(err)
    t.equal(res.statusCode, 502)
  })
})

test('First success win', t => {
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
    t.error(err)
    t.equal(res.statusCode, 202)
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
