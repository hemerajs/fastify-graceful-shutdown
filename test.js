'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')

const fastify = Fastify()

test('plugin', (t) => {
  t.plan(1)
  t.ok(true)
})
