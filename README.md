# 🏹 fastify-graceful-shutdown

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)
[![NPM version](https://img.shields.io/npm/v/fastify-graceful-shutdown.svg?style=flat)](https://www.npmjs.com/package/fastify-graceful-shutdown)

Shutdown [Fastify](https://github.com/fastify/fastify) graceful asynchronously. By default the fastify `close` hook is called when `SIGINT` or `SIGTERM` was triggered.

## Features

- Graceful and debug friendly shutdown
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

## Passing options

- `timeout` (number) - The timeout in milliseconds to wait before forceful shutdown. Default is 10 seconds.
- `useExit0` (boolean) - Exit with code 0 after successful shutdown, or 1 if reaching the timeout. Otherwise will exit with the received signal, eg `SIGTERM` or `SIGINT`. Default is `false`.
- `resetHandlersOnInit` (boolean) - Remove preexisting listeners if already created by previous instance of same plugin. Default is `false`.

```js
fastify.register(require('fastify-graceful-shutdown'), {
  timeout: 5000,
  useExit0: true,
  resetHandlersOnInit: true,
})
```

## Usage

```js
fastify.after(() => {
  fastify.gracefulShutdown((signal, next) => {
    fastify.log.info('Received signal to shutdown: %s', signal)
    next()
  })
})
```

## Compatibility

Fastify >=3

## Caveats

- Don't register signal handlers otherwise except with this plugin.
- Can't be used with a different logger other than [Pino](https://github.com/pinojs/pino) because we use the child logger feature to encapsulate the logs.
- Use fastify `onClose` hook to release resources in your plugin.
- The process will be exited after a certain timeout (Default 10 seconds) to protect against stuck process.
