import { FastifyPluginCallback } from 'fastify'

export type fastifyGracefulShutdownOpt = { timeout?: number }

export const fastifyGracefulShutdown: FastifyPluginCallback<fastifyGracefulShutdownOpt>
export default fastifyGracefulShutdown

declare module 'fastify' {
  interface FastifyInstance {
    gracefulShutdown(
      handler: (signal: string, next: (err?: Error) => void) => void
    ): void
  }
}