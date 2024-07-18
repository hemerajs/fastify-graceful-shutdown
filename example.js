'use strict'

const fastify = require('fastify')({
  logger: {
    level: 'debug',
  },
})

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

fastify.register(require('./')).after((err) => {
  if (err) {
    fastify.log.error(err)
  }
  // Register custom clean up handler
  fastify.gracefulShutdown(async (signal) => {
    fastify.log?.info('received signal to shutdown: %s', signal)
    await wait(3000)
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
    port: 3000,
  },
  (err) => {
    if (err) throw err
    console.log(`server listening on ${fastify.server.address().port}`)
  },
)
