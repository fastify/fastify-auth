'use strict'

class AuthState {
  constructor () {
    this.next = null
    this.i = 0
    this.j = 0
    this.handlers = []
    this.options = {}
    this.request = null
    this.reply = null
    this.done = null
    this.currentError = null
    this.skipFurtherErrors = false
    this.skipFurtherArrayErrors = false
    this.onComplete = null
  }

  get #isRunAll () {
    return this.options.run === 'all'
  }

  get #isRelationAnd () {
    return this.options.relation === 'and'
  }

  nextAuthHandler (err) {
    if (!this.skipFurtherErrors) {
      this.currentError = err
    }
    const handler = this.handlers[this.i++]
    if (!handler) {
      return this.completeAuth()
    }
    if (!Array.isArray(handler)) {
      return this.processAuth(handler, this.#handleSingleHandlerResult)
    }
    this.j = 0
    this.skipFurtherArrayErrors = false
    this.processAuthArray(handler, this.#handleArrayHandlerResult)
  }

  #handleSingleHandlerResult = (err) => {
    if (!this.#isRunAll) {
      this.currentError = err
    }
    if (this.#isRelationAnd) {
      if (err && !this.#isRunAll) {
        return this.completeAuth()
      }
      if (err && this.#isRunAll && !this.skipFurtherErrors) {
        this.skipFurtherErrors = true
        this.currentError = err
      }
      return this.nextAuthHandler(err)
    }
    if (!err && !this.#isRunAll) {
      return this.completeAuth()
    }
    if (!err && this.#isRunAll) {
      this.skipFurtherErrors = true
      this.currentError = null
    }
    this.nextAuthHandler(err)
  }

  #handleArrayHandlerResult = (err) => {
    if (this.#isRelationAnd) {
      if (!err && !this.#isRunAll) {
        return this.nextAuthHandler(err)
      }
      this.currentError = err
      return this.nextAuthHandler(err)
    }
    if (err && !this.#isRunAll) {
      this.currentError = err
      return this.nextAuthHandler(err)
    }
    if (!err && !this.#isRunAll) {
      this.currentError = null
      return this.completeAuth()
    }
    this.nextAuthHandler(err)
  }

  processAuthArray (handlers, callback, err) {
    const handler = handlers[this.j++]
    if (!handler) {
      return callback(err)
    }
    this.processAuth(handler, (err) => {
      this.#handleArrayElementResult(handlers, callback, err)
    })
  }

  #handleArrayElementResult = (handlers, callback, err) => {
    if (this.#isRelationAnd) {
      if (!err && !this.#isRunAll) {
        return callback(err)
      }
      if (!err && this.#isRunAll) {
        this.skipFurtherArrayErrors = true
      }
      return this.processAuthArray(handlers, callback, this.skipFurtherArrayErrors ? null : err)
    }
    if (err && !this.#isRunAll) {
      return callback(err)
    }
    this.processAuthArray(handlers, callback, err)
  }

  processAuth (handler, callback) {
    try {
      const maybePromise = handler(this.request, this.reply, callback)
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(() => callback(null), callback)
      }
    } catch (err) {
      callback(err)
    }
  }

  completeAuth () {
    const code = this.reply.raw.statusCode
    if (this.currentError && (!code || code < 400)) {
      this.reply.code(401)
    } else if (!this.currentError && code && code >= 400) {
      this.reply.code(200)
    }
    this.done(this.currentError)
    this.onComplete?.()
  }
}

module.exports = AuthState
