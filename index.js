'use strict'

const fp = require('fastify-plugin')
const handlers = []

function doActions(signal) {
  try {
    return Promise.all(handlers.map(action => action(signal)))
  } catch (err) {
    return Promise.reject(err)
  }
}

function addHandler(handler) {
  handlers.push(handler)
}

function fastifyGracefulShutdown(fastify, opts, next) {
  fastify.decorate('graceful', addHandler)

  // shutdown fastify
  addHandler(code => {
    return new Promise((resolve, reject) => {
      fastify.close(err => {
        if (err) {
          return reject(err)
        }
        return resolve()
      })
    })
  })

  process.on('cleanup', code => {
    doActions(code)
      .then(x => {
        fastify.logger.info({ exitCode: code }, 'graceful shutdown')
        process.exit(0)
      })
      .catch(err => {
        fastify.logger.error({ err: err, exitCode: code }, 'graceful shutdown')
        process.exit(1)
      })
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
