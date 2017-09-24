# fastify-graceful-shutdown
Asynchronous shutdown of fastify. By default the fastify `close` hook is called when `SIGINT` or `SIGTERM` was triggered.

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
fastify.graceful(() => {
  return new Promise((resolve, reject) => {
    // clean up some stuff
  })
})
```