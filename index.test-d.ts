import fastify from 'fastify'
import plugin from '.'

const app = fastify()

app.register(plugin, { timeout: 1 })

app.gracefulShutdown((signal: string, next: () => void) => {})