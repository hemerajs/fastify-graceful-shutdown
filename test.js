'use strict'

const Fastify = require('fastify')
const fastifyGracefulShutdown = require('./')
const { expect } = require('chai')

describe('fastify-graceful-shutdown', () => {
  it('can start and stop multiple instances of fastify', async () => {
    const fastify = Fastify()
    fastify.register(fastifyGracefulShutdown, { resetHandlersOnInit: true })

    fastify.after(() => {
      fastify.gracefulShutdown(async (signal) => {
        fastify.log.info('Starting graceful shutdown')
      })
    })

    await fastify.ready()
    await fastify.close()

    const fastify2 = Fastify()
    fastify2.register(fastifyGracefulShutdown, { resetHandlersOnInit: true })

    fastify2.after(() => {
      fastify2.gracefulShutdown(async (signal) => {
        fastify2.log.info('Starting graceful shutdown')
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
        timeout: (1, removedListeners.push({ signal, listener }))
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
      fastify.gracefulShutdown(async (signal) => {
        fastify.log.info('Starting graceful shutdown')
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
      fastify.gracefulShutdown(async (signal) => {
        fastify.log.info('Starting graceful shutdown')
      })
    })

    await fastify.ready()
    await fastify.close()
  })

  it('afterGracefulShutdown does not run on direct fastify.close()', async () => {
    const fastify = Fastify()
    let handlerCalled = false

    fastify.register(fastifyGracefulShutdown, { resetHandlersOnInit: true })

    fastify.after(() => {
      fastify.afterGracefulShutdown(async (signal) => {
        handlerCalled = true
      })
    })

    await fastify.ready()
    await fastify.close()

    expect(handlerCalled).to.eq(false)
  })

  it('afterGracefulShutdown receives signal when triggered by signal', async function () {
    this.timeout(10000)
    const fastify = Fastify()
    let receivedSignal = null

    const mockEventListener = {
      removeListener: () => {},
      once: (signal, listener) => {
        if (signal === 'SIGTERM') {
          // simulate signal after registration
          setTimeout(() => listener(), 50)
        }
      },
      listenerCount: () => 0,
      exit: () => {},
    }

    fastify.register(fastifyGracefulShutdown, {
      handlerEventListener: mockEventListener,
    })

    fastify.after(() => {
      fastify.afterGracefulShutdown(async (signal) => {
        receivedSignal = signal
      })
    })

    await fastify.ready()

    // wait for the simulated signal to trigger shutdown
    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(receivedSignal).to.eq('SIGTERM')
  })

  it('gracefulShutdown runs before afterGracefulShutdown', async function () {
    this.timeout(10000)
    const fastify = Fastify()
    const order = []

    const mockEventListener = {
      removeListener: () => {},
      once: (signal, listener) => {
        if (signal === 'SIGTERM') {
          setTimeout(() => listener(), 50)
        }
      },
      listenerCount: () => 0,
      exit: () => {},
    }

    fastify.register(fastifyGracefulShutdown, {
      handlerEventListener: mockEventListener,
    })

    fastify.after(() => {
      fastify.gracefulShutdown(async (signal) => {
        order.push('pre-close')
      })
      fastify.afterGracefulShutdown(async (signal) => {
        order.push('on-close')
      })
    })

    await fastify.ready()

    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(order).to.deep.eq(['pre-close', 'on-close'])
  })

  it('afterGracefulShutdown throws on non-function argument', async () => {
    const fastify = Fastify()
    fastify.register(fastifyGracefulShutdown, { resetHandlersOnInit: true })

    await fastify.ready()

    expect(() => fastify.afterGracefulShutdown('not a function')).to.throw(
      'Expected a function but got a string',
    )
  })
})
