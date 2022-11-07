# 🏹 fastify-graceful-shutdown

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)
[![NPM version](https://img.shields.io/npm/v/fastify-graceful-shutdown.svg?style=flat)](https://www.npmjs.com/package/fastify-graceful-shutdown)

Shutdown [Fastify](https://github.com/fastify/fastify) graceful asynchronously. By default the fastify `close` hook is called when `SIGINT` or `SIGTERM` was triggered.

## Install

```bash
npm install --save fastify-graceful-shutdown
```

## Register plugin

```js
fastify.register(require('fastify-graceful-shutdown'))
```

## Usage

```js
fastify.after(() => {
  fastify.gracefulShutdown((signal, next) => {
    console.log('Upps!')
    next()
  })
})
```

## Compatibility

Fastify >=3

## Caveats

- Don't register signal handlers otherwise except with this plugin unless you are absolutely sure how they work together (use `opts.ignoreExistingHandlers` to enable).
- Can't be used with a different logger other than [Pino](https://github.com/pinojs/pino) because we use the child logger feature to encapsulate the logs.
- Use fastify `onClose` hook to release resources in your plugin.
- The process will be exited after a certain timeout (Default 10 seconds) to protect against stuck process.
