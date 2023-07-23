import { FastifyPluginCallback } from 'fastify'
import { EventEmitter } from 'events'

type FastifyGracefulShutdownPlugin =
  FastifyPluginCallback<fastifyGracefulShutdown.fastifyGracefulShutdownOptions>

declare module 'fastify' {
  interface FastifyInstance {
    gracefulShutdown(
      handler: (signal: string, next: (err?: Error) => void) => void,
    ): void
  }
}

declare namespace fastifyGracefulShutdown {
  export type fastifyGracefulShutdownOptions = {
    timeout?: number
    resetHandlersOnInit?: boolean
    handlerEventListener?: EventEmitter & { exit(code?: number): never }
  }

  export const fastifyGracefulShutdown: FastifyGracefulShutdownPlugin
  export { fastifyGracefulShutdown as default }
}

declare function fastifyGracefulShutdown(
  ...params: Parameters<FastifyGracefulShutdownPlugin>
): ReturnType<FastifyGracefulShutdownPlugin>

export = fastifyGracefulShutdown
