'use strict'

const fp = require('fastify-plugin')
const parallel = require('fastparallel')()

function fastifyGracefulShutdown(fastify, opts, next) {
  const logger = fastify.logger.child({ plugin: 'fastify-graceful-shutdown' })
  const handlers = []
  const timeout = opts.timeout || 10000
  const signals = ['SIGINT', 'SIGTERM']

  signals.forEach(signal => {
    if (process.listenerCount(signal) > 0) {
      throw new Error(
        `${signal} handler was already registered use fastify.gracefulShutdown`
      )
    }
  })

  function completed(err, signal) {
    if (err) {
      logger.error({ err: err, signal: signal }, 'process terminated')
      process.exit(1)
    } else {
      logger.info({ signal: signal }, 'process terminated')
      process.exit(0)
    }
  }

  function terminateAfterTimeout(signal, timeout) {
    setTimeout(() => {
      logger.error(
        { signal: signal, timeout: timeout },
        'terminate process after timeout'
      )
      process.exit(1)
    }, timeout)
  }

  function shutdown(signal) {
    parallel(null, handlers, signal, err => completed(err, signal))
  }

  function addHandler(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Expected a function but got a ' + typeof handler)
    }
    handlers.push(handler)
  }

  fastify.decorate('gracefulShutdown', addHandler)

  // shutdown fastify
  addHandler((signal, cb) => {
    logger.info({ signal: signal }, 'triggering close hook')
    fastify.close(cb)
  })

  // register handlers
  signals.forEach(signal => {
    process.once(signal, () => {
      terminateAfterTimeout(signal, timeout)
      logger.info({ signal: signal }, 'received signal')
      shutdown(signal)
    })
  })

  next()
}

module.exports = fp(fastifyGracefulShutdown, '>=0.28.2')
