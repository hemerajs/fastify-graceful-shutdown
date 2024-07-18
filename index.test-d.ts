import fastify from 'fastify'
import plugin from '.'

const app = fastify()

app.register(plugin, {
  timeout: 1,
  resetHandlersOnInit: false,
  handlerEventListener: process,
})
app.register(plugin, { timeout: 1 })
app.register(plugin)

app.gracefulShutdown((signal: string) => {})
app.gracefulShutdown(async (signal: string) => {})
