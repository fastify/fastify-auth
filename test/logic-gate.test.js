'use strict'

const auth = require('../auth')

const { test } = require('node:test')

let fuzzTryAuth
test.before(() => {
  const fakify = {
    decorate (str, obj) {
      this[str] = obj
    }
  }

  auth(fakify, {}, (err) => {
    if (err) {
      console.log('Next function callback called with an error', err)
    }
  })

  const t = (_a, _b, done) => done()
  const f = (_a, _b, done) => done(new Error('false'))
  const evalOr = (v) => v.some(vi => Array.isArray(vi) ? evalAnd(vi) : vi)
  const evalAnd = (v) => v.every(vi => Array.isArray(vi) ? evalOr(vi) : vi)
  const boolsAsFunc = (arr) => arr.map((bi) => Array.isArray(bi) ? boolsAsFunc(bi) : (bi ? t : f))

  function tryAuthWith (arr, relation) {
    test(`Relation ${relation} for expression ${JSON.stringify(arr)}`, (t, done) => {
      t.plan(1)
      const expectedResult = relation === 'or' ? evalOr(arr) : evalAnd(arr)
      const funcs = boolsAsFunc(arr)
      const authFunc = fakify.auth(funcs, { relation })
      const req = {}
      const reply = {
        raw: { statusCode: undefined },
        code: (value) => value
      }
      let result
      authFunc(req, reply, err => { result = !err })
      t.assert.equal(result, expectedResult)
      done()
    })
  }

  function * fuzzShape (arr) {
    if (!Array.isArray(arr)) {
      if (arr === 1) yield * [false, true]
      else yield arr
      return
    }
    if (arr.length === 0) {
      yield []
      return
    }
    for (const head of fuzzShape(arr[0])) {
      for (const tail of fuzzShape(arr.slice(1))) {
        yield [head, ...tail]
      }
    }
  }

  fuzzTryAuth = function (shape) {
    for (const arr of fuzzShape(shape)) {
      tryAuthWith(arr, 'or')
      tryAuthWith(arr, 'and')
    }
  }
})

for (const shape of
  [
    [1, 1],
    [1, [1, 1], 1, 1],
    [1, [1, 1], 1],
    [1, [1, 1], [1, 1]],
    [1, [1, 1]],
    [1],
    [[1, 1], 1],
    [[1, 1], [1, 1]],
    [[1, 1]],
    [[1], 1],
    [[1]],
    [[]],
    [1, [[1, 1], 1]],
  ]
) {
  fuzzTryAuth(shape)
}
