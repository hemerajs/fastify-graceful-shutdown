'use strict'

const path = require('path')
const childProcess = require('child_process')
const { expect } = require('chai')
const Fastify = require('fastify')

const fastifyGracefulShutdown = require('./')

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
      fastify.gracefulShutdown(async (signal) => {
        fastify.log.info('Starting graceful shutdown')
      })
    })

    await fastify.ready()
    await fastify.close()

    expect(addedListeners.length).to.eq(2)
    expect(removedListeners.length).to.eq(0)
  })

  // Test all default signals with default configuration (exits with received signal)
  ;['SIGINT', 'SIGTERM'].forEach((killSignal, i) => {
    ;['50', '300'].forEach((timeout) => {
      it(`exits with passed signal (${killSignal}) - timeout ${timeout}`, function (done) {
        this.timeout(10000)

        const shouldTimeout = timeout === '50'
        const proc = childProcess.fork(path.join(__dirname, 'example.js'), {
          stdio: 'pipe',
          env: {
            ...process.env,
            GRACEFUL_SHUTDOWN_PORT: `${51093 + i}`,
            GRACEFUL_SHUTDOWN_DELAY: '100',
            GRACEFUL_SHUTDOWN_TIMEOUT: timeout,
          },
        })

        const logLines = []
        proc.on('exit', (_, signal) => {
          expect(signal).to.eq(killSignal)
          const hasSeenShutdownTimeout = logLines.some((line) =>
            line.includes('Terminate process after timeout'),
          )
          const hasSeenGracefulShutdown = logLines.some((line) =>
            line.includes('graceful shutdown complete'),
          )
          expect(
            hasSeenGracefulShutdown,
            'seen graceful shutdown log message',
          ).to.eq(!shouldTimeout)
          expect(
            hasSeenShutdownTimeout,
            'seen shutdown timeout log message',
          ).to.eq(shouldTimeout)
          done()
        })

        // Send kill signal on first data chunk
        proc.stdout.once('data', () =>
          expect(proc.kill(killSignal), `${killSignal} success`).to.eq(true),
        )

        // See if we've seen the appropriate log message
        proc.stdout.on('data', (chunk) => {
          logLines.push(chunk.toString().trim())
        })
      })
    })
  })

  // Test all default signals with `useExit0` option (exits with 0/1)
  ;['SIGINT', 'SIGTERM'].forEach((killSignal, i) => {
    ;['50', '300'].forEach((timeout) => {
      it(`exits with 0 on 'useExit0: true' option (${killSignal}) - timeout ${timeout}`, function (done) {
        this.timeout(10000)

        const shouldTimeout = timeout === '50'
        const proc = childProcess.fork(path.join(__dirname, 'example.js'), {
          stdio: 'pipe',
          env: {
            ...process.env,
            GRACEFUL_SHUTDOWN_PORT: `${51095 + i}`,
            GRACEFUL_SHUTDOWN_DELAY: '100',
            GRACEFUL_SHUTDOWN_USE_EXIT_0: 'true',
            GRACEFUL_SHUTDOWN_TIMEOUT: timeout,
          },
        })

        const logLines = []
        proc.on('exit', (code) => {
          expect(code).to.eq(shouldTimeout ? 1 : 0)
          const hasSeenShutdownTimeout = logLines.some((line) =>
            line.includes('Terminate process after timeout'),
          )
          const hasSeenGracefulShutdown = logLines.some((line) =>
            line.includes('graceful shutdown complete'),
          )
          expect(
            hasSeenGracefulShutdown,
            'seen graceful shutdown log message',
          ).to.eq(!shouldTimeout)
          expect(
            hasSeenShutdownTimeout,
            'seen shutdown timeout log message',
          ).to.eq(shouldTimeout)
          done()
        })

        // Send kill signal on first data chunk
        proc.stdout.once('data', () =>
          expect(proc.kill(killSignal), `${killSignal} success`).to.eq(true),
        )

        // See if we've seen the appropriate log message
        proc.stdout.on('data', (chunk) => {
          logLines.push(chunk.toString().trim())
        })
      })
    })
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
})
