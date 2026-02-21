# 🏹 fastify-graceful-shutdown

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)
[![NPM version](https://img.shields.io/npm/v/fastify-graceful-shutdown.svg?style=flat)](https://www.npmjs.com/package/fastify-graceful-shutdown)

Shutdown [Fastify](https://github.com/fastify/fastify) graceful asynchronously. By default the fastify `close` hook is called when `SIGINT` or `SIGTERM` was triggered.

## Features

- Graceful and debug friendly shutdown
- Two-phase shutdown: pre-close handlers (before drain) and on-close handlers (after drain)
- Flush the fastify logger before process exit to avoid losing logs
- Handlers are called in parallel for faster shutdown

## Install

```bash
npm install --save fastify-graceful-shutdown
```

## Register plugin

```js
fastify.register(require('fastify-graceful-shutdown'))
```

## Usage

The plugin provides two decorators for registering shutdown handlers that run at different phases:

### `gracefulShutdown` — Immediate signal handler

Runs **immediately** when a shutdown signal (`SIGINT`/`SIGTERM`) is received, before `fastify.close()` is called. At this point the server is still fully operational — it is still accepting new connections and actively processing requests. Use this for actions that should happen before the server starts rejecting requests with 503, such as deregistering from a load balancer or service discovery, stopping message queue consumers, or flipping a health check to unhealthy.

```js
fastify.after(() => {
  fastify.gracefulShutdown(async (signal) => {
    fastify.log.info('Received signal to shutdown: %s', signal)
    await deregisterFromLoadBalancer()
  })
})
```

### `afterGracefulShutdown` — On-close handler

Runs **during** the `onClose` lifecycle, after the server has stopped accepting new connections and all in-flight requests have been drained. These handlers **only run when shutdown was triggered by a signal** (`SIGINT`/`SIGTERM`) — they will not run if `fastify.close()` is called directly (e.g., in tests). If you need cleanup that runs on every close regardless of the trigger, use Fastify's built-in `onClose` hook instead. Use this for cleanup that is only safe once no more requests are being processed, such as closing database connections, disconnecting from Redis, or flushing buffers.

```js
fastify.after(() => {
  fastify.afterGracefulShutdown(async (signal) => {
    fastify.log.info('Received signal to shutdown: %s', signal)
    await db.close()
  })
})
```

### Shutdown order

When a signal is received, the shutdown proceeds in this order:

1. Signal received (`SIGINT`/`SIGTERM`)
2. **Immediate handlers** (`gracefulShutdown`) run in parallel — server is still fully operational
3. `fastify.close()` is called — new requests get 503, in-flight requests are drained
4. **On-close handlers** (`afterGracefulShutdown`) run during the `onClose` lifecycle — all requests are done
5. Process exits

## Compatibility

Fastify >=5

## Caveats

- Don't register signal handlers otherwise except with this plugin.
- Can't be used with a different logger other than [Pino](https://github.com/pinojs/pino) because we use the child logger feature to encapsulate the logs.
- The process will be exited after a certain timeout (Default 10 seconds) to protect against stuck process.
