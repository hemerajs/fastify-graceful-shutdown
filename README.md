# fastify-graceful-shutdown
Shutdown fastify graceful asynchronously. By default the fastify `close` hook is called when `SIGINT` or `SIGTERM` was triggered.

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
fastify.graceful((exitCode, next) => {
  next()
})
```
