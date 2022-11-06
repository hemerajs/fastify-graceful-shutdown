'use strict'

const fp = require('fastify-plugin')
const process = require('process')
const parallel = require('fastparallel')()

let registeredListeners = []

function fastifyGracefulShutdown(fastify, opts, next) {
  const logger = fastify.log.child({ plugin: 'fastify-graceful-shutdown' })
  const handlers = []
  const timeout = opts.timeout || 10000
  const signals = ['SIGINT', 'SIGTERM']
  const handlerEventListener = opts.handlerEventListener || process
  const ignoreExistingHandlers = opts.ignoreExistingHandlers || false

  // Remove preexisting listeners if already created by previous instance of same plugin
  if (opts.resetHandlersOnInit) {
    registeredListeners.forEach(({ signal, listener }) => {
      handlerEventListener.removeListener(signal, listener)
    })
    registeredListeners = []
  }

  if(!ignoreExistingHandlers) {
    for (let i = 0; i < signals.length; i++) {
      let signal = signals[i]
      if (handlerEventListener.listenerCount(signal) > 0) {
        next(
          new Error(
            `${signal} handler was already registered use fastify.gracefulShutdown`
          )
        )
        return
      }
    }
  }

  function completed(err, signal) {
    if (err) {
      logger.error({ err: err, signal: signal }, 'process terminated')
      handlerEventListener.exit(1)
    } else {
      logger.info({ signal: signal }, 'process terminated')
      handlerEventListener.exit(0)
    }
  }

  function terminateAfterTimeout(signal, timeout) {
    setTimeout(() => {
      logger.error(
        { signal: signal, timeout: timeout },
        'terminate process after timeout'
      )
      handlerEventListener.exit(1)
    }, timeout).unref()
  }

  function shutdown(signal) {
    parallel(null, handlers, signal, (err) => completed(err, signal))
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
  signals.forEach((signal) => {
    const listener = () => {
      terminateAfterTimeout(signal, timeout)
      logger.info({ signal: signal }, 'received signal')
      shutdown(signal)
    }
    registeredListeners.push({ signal, listener })
    handlerEventListener.once(signal, listener)
  })

  next()
}

module.exports = fp(fastifyGracefulShutdown, {
  fastify: '>=3.0.0',
  name: 'fastify-graceful-shutdown',
})
