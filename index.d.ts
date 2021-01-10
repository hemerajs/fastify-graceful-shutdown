import { FastifyPluginCallback } from 'fastify'

export type fastifyGracefulShutdownOpt = { timeout?: number }

export const fastifyGracefulShutdown: FastifyPluginCallback<fastifyGracefulShutdownOpt>
export default fastifyGracefulShutdown
