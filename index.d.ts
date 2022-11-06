import { FastifyPluginCallback } from 'fastify'
import { EventEmitter } from 'events'

export type fastifyGracefulShutdownOpt = {
  timeout?: number
  resetHandlersOnInit?: boolean
  handlerEventListener?: EventEmitter & { exit(code?: number): never; }
  ignoreExistingHandlers?: boolean
}

export const fastifyGracefulShutdown: FastifyPluginCallback<fastifyGracefulShutdownOpt>
export default fastifyGracefulShutdown

declare module 'fastify' {
  interface FastifyInstance {
    gracefulShutdown(
      handler: (signal: string, next: (err?: Error) => void) => void
    ): void
  }
}
