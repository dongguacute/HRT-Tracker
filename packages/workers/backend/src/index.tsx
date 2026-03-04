import { Hono } from 'hono'
import { runSimulation } from '@hrt-tracker/core'

const app = new Hono().basePath('/api')

app.post('/simulate', async (c) => {
  try {
    const { events, weight } = await c.req.json()
    const result = runSimulation(events, weight || 60)
    return c.json(result)
  } catch (e) {
    return c.json({ error: 'Simulation failed' }, 400)
  }
})

app.get('/hello', (c) => {
  return c.json({
    message: 'Hello Hono from /api/hello!'
  })
})

export default app
