'use strict'

const fp = require('fastify-plugin')
const parallel = require('fastparallel')()
const handlers = []
let clean = false

function fastifyGracefulShutdown(fastify, opts, next) {
  function completed(err, code) {
    if (err) {
      fastify.logger.error({ err: err, exitCode: code }, 'graceful shutdown')
      process.exit(1)
    } else {
      fastify.logger.info({ exitCode: code }, 'graceful shutdown')
      process.exit(0)
    }
  }

  function shutdown(signal) {
    if (!clean) {
      clean = true
      parallel(null, handlers, signal, err => completed(err, signal))
    }
  }

  function addHandler(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Expected a function but got a ' + typeof handler)
    }
    handlers.push(handler)
  }

  fastify.decorate('graceful', addHandler)

  // shutdown fastify
  addHandler((code, cb) => {
    fastify.close(cb)
  })

  // catch ctrl+c event and exit normally
  process.on('SIGINT', function() {
    shutdown('SIGINT')
  })

  // is sent to a process to request its termination
  process.on('SIGTERM', function() {
    shutdown('SIGTERM')
  })

  next()
}

module.exports = fp(fastifyGracefulShutdown, '>=0.28.2')
