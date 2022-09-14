'use strict'

const Fastify = require('fastify')
const fastifyGracefulShutdown = require('./')

describe('fastify-graceful-shutdown', () => {
  it('can start and stop multiple instances of fastify', async () => {
    const fastify = Fastify()
    fastify.register(fastifyGracefulShutdown)

    fastify.after(() => {
      fastify.gracefulShutdown((signal, next) => {
        fastify.log.info('Starting graceful shutdown')
        next()
      })
    })

    await fastify.ready()
    await fastify.close()

    const fastify2 = Fastify()
    fastify2.register(fastifyGracefulShutdown)

    fastify2.after(() => {
      fastify2.gracefulShutdown((signal, next) => {
        fastify2.log.info('Starting graceful shutdown')
        next()
      })
    })

    await fastify2.ready()
    await fastify2.close()
  })
})
