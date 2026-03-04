import { Hono, Context, Next } from 'hono'
import { runSimulation } from '@hrt-tracker/core'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { config } from 'dotenv'
import { resolve } from 'path'

// 加载根目录的 .env 文件
config({ path: resolve(process.cwd(), '../../.env') })

type Bindings = {
  ADMIN_USERNAME?: string
  ADMIN_PASSWORD?: string
  JWT_SECRET: string
  USER_STORAGE: DurableObjectNamespace<any>
}

type Variables = {
  user: {
    username: string
    role: 'admin' | 'user'
  }
}

// 内存回退存储（用于 Vite 开发环境）
const memoryUsers = new Map<string, any>()

/**
 * Durable Object 用于存储用户信息
 */
export class UserStorage {
  constructor(private state: any, private env: Bindings) {}

  async getUsers(): Promise<any[]> {
    const users = await this.state.storage.list()
    return Array.from(users.values())
  }

  async getUser(username: string): Promise<any> {
    return await this.state.storage.get(username)
  }

  async setUser(username: string, userData: any): Promise<void> {
    await this.state.storage.put(username, userData)
  }

  async deleteUser(username: string): Promise<void> {
    await this.state.storage.delete(username)
  }
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>().basePath('/api')

// 统一的数据访问层，处理环境差异
const getUserDataLayer = (c: Context<any>) => {
  if (c.env?.USER_STORAGE) {
    const id = c.env.USER_STORAGE.idFromName('global_user_storage')
    const storage = c.env.USER_STORAGE.get(id)
    return {
      getUser: (name: string) => storage.getUser(name),
      getUsers: () => storage.getUsers(),
      setUser: (name: string, data: any) => storage.setUser(name, data),
      deleteUser: (name: string) => storage.deleteUser(name)
    }
  }
  
  // Vite/Node 环境回退到内存
  console.warn('USER_STORAGE not found, falling back to memory storage')
  return {
    getUser: async (name: string) => memoryUsers.get(name),
    getUsers: async () => Array.from(memoryUsers.values()),
    setUser: async (name: string, data: any) => memoryUsers.set(name, data),
    deleteUser: async (name: string) => memoryUsers.delete(name)
  }
}

// 鉴权中间件
const authMiddleware = async (c: Context<any>, next: Next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    c.set('user', payload)
    await next()
  } catch (e) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

// 登录接口
app.post('/auth/login', async (c) => {
  const { username, password } = await c.req.json()
  
  const adminUser = process.env.ADMIN_USERNAME || c.env?.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD || c.env?.ADMIN_PASSWORD

  let user: { username: string, role: 'admin' | 'user' } | null = null
  
  if (adminUser && username === adminUser && password === adminPass) {
    user = { username: adminUser, role: 'admin' }
  } else {
    const storage = getUserDataLayer(c)
    const storedUser = await storage.getUser(username)
    if (storedUser && storedUser.password === password) {
      user = { 
        username: storedUser.username, 
        role: (storedUser.role === 'admin' ? 'admin' : 'user')
      }
    }
  }

  if (user) {
    const payload = { ...user, exp: Date.now() + 86400000 }
    const token = btoa(JSON.stringify({})) + '.' + btoa(JSON.stringify(payload)) + '.sig'
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 86400,
      path: '/'
    })
    return c.json({ user })
  }

  return c.json({ error: 'Invalid credentials' }, 401)
})

app.post('/auth/logout', (c) => {
  deleteCookie(c, 'auth_token')
  return c.json({ success: true })
})

app.get('/auth/me', authMiddleware, (c) => {
  const user = c.get('user')
  return c.json({ user })
})

// 管理员接口：创建用户
app.post('/admin/users', authMiddleware, async (c) => {
  const currentUser = c.get('user')
  if (currentUser.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const { username, password } = await c.req.json()
  const storage = getUserDataLayer(c)
  
  if (await storage.getUser(username)) {
    return c.json({ error: 'User already exists' }, 400)
  }

  await storage.setUser(username, { username, password, role: 'user' })
  return c.json({ success: true })
})

// 管理员接口：修改用户密码
app.patch('/admin/users/:username', authMiddleware, async (c) => {
  const currentUser = c.get('user')
  if (currentUser.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const targetUsername = c.req.param('username')
  const { password } = await c.req.json()

  const storage = getUserDataLayer(c)
  const user = await storage.getUser(targetUsername)
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  if (user.role === 'admin') {
    return c.json({ error: 'Cannot modify admin password via this API' }, 403)
  }

  user.password = password
  await storage.setUser(targetUsername, user)
  return c.json({ success: true })
})

// 管理员接口：删除用户
app.delete('/admin/users/:username', authMiddleware, async (c) => {
  const currentUser = c.get('user')
  if (currentUser.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const targetUsername = c.req.param('username')
  const storage = getUserDataLayer(c)
  const user = await storage.getUser(targetUsername)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  if (user.role === 'admin') {
    return c.json({ error: 'Cannot delete admin user' }, 403)
  }

  await storage.deleteUser(targetUsername)
  return c.json({ success: true })
})

app.get('/admin/users', authMiddleware, async (c) => {
  const currentUser = c.get('user')
  if (currentUser.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }
  
  const storage = getUserDataLayer(c)
  const users = await storage.getUsers()
  
  return c.json({ users: users.map((u: any) => ({ username: u.username, role: u.role })) })
})

// 原有接口
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
