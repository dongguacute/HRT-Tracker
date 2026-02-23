import { Hono } from 'hono'

const app = new Hono().basePath('/api')

app.get('/hello', (c) => {
  return c.json({
    message: 'Hello Hono from /api/hello!'
  })
})

export default app
