'use strict'

const fastify = require('fastify')({
  logger: {
    level: 'debug',
  },
})

const port = parseInt(process.env.GRACEFUL_SHUTDOWN_PORT, 10) || 3000
const shutdownDelay = parseInt(process.env.GRACEFUL_SHUTDOWN_DELAY, 10) || 3000
const timeout = parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT, 10) || 10000
const useExit0 = process.env.GRACEFUL_SHUTDOWN_USE_EXIT_0 === 'true'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

fastify.register(require('./'), { useExit0, timeout }).after((err) => {
  if (err) {
    fastify.log.error(err)
  }
  // Register custom clean up handler
  fastify.gracefulShutdown(async (signal) => {
    fastify.log?.info('received signal to shutdown: %s', signal)
    await wait(shutdownDelay)
    fastify.log?.info('graceful shutdown complete')
  })
})

const schema = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          hello: {
            type: 'string',
          },
        },
      },
    },
  },
}

fastify.get('/', schema, async function (req, reply) {
  await wait(3000)
  reply.send({ hello: 'world' })
})

fastify.listen(
  {
    host: '127.0.0.1',
    port,
  },
  (err) => {
    if (err) throw err
    console.log(`server listening on ${fastify.server.address().port}`)
  },
)
