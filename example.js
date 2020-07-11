'use strict'

const fastify = require('fastify')({
  logger: {
    level: 'info',
  },
})

fastify.register(require('./')).after((err) => {
  fastify.log.error(err)
  // Register custom clean up handler
  fastify.gracefulShutdown((code, cb) => {
    cb()
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

fastify.get('/', schema, function (req, reply) {
  reply.send({ hello: 'world' })
})

fastify.listen(3000, (err) => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
