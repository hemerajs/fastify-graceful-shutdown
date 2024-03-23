'use strict'

const Fastify = require('fastify')
const fastifyGracefulShutdown = require('./')
const { expect } = require('chai')

describe('fastify-graceful-shutdown', () => {
  it('can start and stop multiple instances of fastify', async () => {
    const fastify = Fastify()
    fastify.register(fastifyGracefulShutdown, { resetHandlersOnInit: true })

    fastify.after(() => {
      fastify.gracefulShutdown((signal, next) => {
        fastify.log.info('Starting graceful shutdown')
        next()
      })
    })

    await fastify.ready()
    await fastify.close()

    const fastify2 = Fastify()
    fastify2.register(fastifyGracefulShutdown, { resetHandlersOnInit: true })

    fastify2.after(() => {
      fastify2.gracefulShutdown((signal, next) => {
        fastify2.log.info('Starting graceful shutdown')
        next()
      })
    })

    await fastify2.ready()
    await fastify2.close()
  })

  it('can pass handlerEventListener override', async function () {
    this.timeout(10000)
    const fastify = Fastify()

    let removedListeners = []
    let addedListeners = []
    const mockEventListener = {
      removeListener: (signal, listener) => {
        timeout: 1, removedListeners.push({ signal, listener })
      },
      once: (signal, listener) => {
        addedListeners.push({ signal, listener })
      },
      listenerCount: (signal) =>
        addedListeners.length - removedListeners.length,
      exit: (exitCode) => {},
    }
    fastify.register(fastifyGracefulShutdown, {
      handlerEventListener: mockEventListener,
    })

    fastify.after(() => {
      fastify.gracefulShutdown((signal, next) => {
        fastify.log.info('Starting graceful shutdown')
        next()
      })
    })

    await fastify.ready()
    await fastify.close()

    expect(addedListeners.length).to.eq(2)
    expect(removedListeners.length).to.eq(0)
  })

  it('work without logger enabled', async () => {
    const fastify = Fastify({
      logger: false,
    })
    fastify.register(fastifyGracefulShutdown, { resetHandlersOnInit: true })

    fastify.after(() => {
      fastify.gracefulShutdown((signal, next) => {
        fastify.log.info('Starting graceful shutdown')
        next()
      })
    })

    await fastify.ready()
    await fastify.close()
  })
})
