'use strict'

const fp = require('fastify-plugin')
const parallel = require('fastparallel')()
const handlers = []

function fastifyGracefulShutdown(fastify, opts, next) {
  function done(err, code) {
    if (err) {
      fastify.logger.error({ err: err, exitCode: code }, 'graceful shutdown')
      process.exit(1)
    } else {
      fastify.logger.info({ exitCode: code }, 'graceful shutdown')
      process.exit(0)
    }
  }

  function doActions(signal) {
    parallel(null, handlers, signal, (err) => done(err, signal))
  }

  function addHandler(handler) {
    handlers.push(handler)
  }

  fastify.decorate('graceful', addHandler)

  // shutdown fastify
  addHandler((code, cb) => {
    fastify.close(cb)
  })

  process.on('cleanup', code => {
    doActions(code)
  })

  // do app specific cleaning before exiting
  process.on('exit', function(code) {
    process.emit('cleanup', code)
  })

  // catch ctrl+c event and exit normally
  process.on('SIGINT', function() {
    doActions('SIGINT')
  })

  // is sent to a process to request its termination
  process.on('SIGTERM', function() {
    doActions('SIGTERM')
  })

  next()
}

module.exports = fp(fastifyGracefulShutdown, '>=0.28.2')
