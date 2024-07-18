'use strict'

const fp = require('fastify-plugin')
const process = require('process')

let registeredListeners = []

function fastifyGracefulShutdown(fastify, opts, next) {
  const logger = fastify.log
    ? fastify.log.child({ plugin: 'fastify-graceful-shutdown' })
    : undefined
  const handlers = []
  const timeout = opts.timeout || 10000
  const signals = ['SIGINT', 'SIGTERM']
  const handlerEventListener = opts.handlerEventListener || process

  // Remove preexisting listeners if already created by previous instance of same plugin
  if (opts.resetHandlersOnInit) {
    registeredListeners.forEach(({ signal, listener }) => {
      handlerEventListener.removeListener(signal, listener)
    })
    registeredListeners = []
  }

  for (let i = 0; i < signals.length; i++) {
    let signal = signals[i]
    if (handlerEventListener.listenerCount(signal) > 0) {
      next(
        new Error(
          `${signal} handler was already registered use fastify.gracefulShutdown`,
        ),
      )
      return
    }
  }

  function completed(err, signal) {
    if (err) {
      logger.error?.({ err: err, signal: signal }, 'process terminated')
    } else {
      logger.debug?.({ signal: signal }, 'process terminated')
    }

    logger.flush?.()
    handlerEventListener.exit(err ? 1 : 0)
  }

  function terminateAfterTimeout(signal, timeout) {
    setTimeout(() => {
      logger.error?.(
        { signal: signal, timeout: timeout },
        'terminate process after timeout',
      )
      handlerEventListener.exit(1)
    }, timeout).unref()
  }

  async function shutdown(signal) {
    await Promise.all(
      handlers.map((handler) => {
        return handler(signal)
      }),
    )
    logger.debug?.({ signal: signal }, 'closing fastify server')
    await fastify.close()
  }

  function addHandler(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Expected a function but got a ' + typeof handler)
    }
    handlers.push(handler)
  }

  fastify.decorate('gracefulShutdown', addHandler)

  // register handlers
  signals.forEach((signal) => {
    const listener = () => {
      logger.debug?.({ signal: signal }, 'received signal')
      terminateAfterTimeout(signal, timeout)
      shutdown(signal)
        .then(() => completed(null, signal))
        .catch((err) => completed(err, signal))
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
