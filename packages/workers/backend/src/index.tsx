import { Hono, Context, Next } from 'hono'
import { runSimulation } from '@hrt-tracker/core'
// @ts-ignore
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { config } from 'dotenv'
// @ts-ignore
import { argon2id, argon2Verify } from 'hash-wasm'
import { authMiddleware, adminMiddleware } from './middleware/auth'

// 加载根目录的 .env 文件
config()

// 内存回退存储（用于 Vite 开发环境）
const memoryUsers = new Map<string, any>()

type Bindings = {
  ADMIN_USERNAME?: string
  ADMIN_PASSWORD?: string
  JWT_SECRET: string
  USER_STORAGE: DurableObjectNamespace<any>
  ASSETS: { fetch: typeof fetch }
}

type Variables = {
  user: {
    username: string
    role: 'admin' | 'user'
  }
}

/**
 * Durable Object 用于存储用户信息
 */
export class UserStorage {
  constructor(private state: any, private env: Bindings) {}

  async getUsers(): Promise<any[]> {
    try {
      const users = await this.state.storage.list()
      return Array.from(users.values())
    } catch (e) {
      console.error('Durable Object getUsers error:', e)
      throw e
    }
  }

  async getUser(username: string): Promise<any> {
    try {
      return await this.state.storage.get(username)
    } catch (e) {
      console.error(`Durable Object getUser error for ${username}:`, e)
      throw e
    }
  }

  async setUser(username: string, userData: any): Promise<void> {
    try {
      await this.state.storage.put(username, userData)
    } catch (e) {
      console.error(`Durable Object setUser error for ${username}:`, e)
      throw e
    }
  }

  async deleteUser(username: string): Promise<void> {
    try {
      await this.state.storage.delete(username)
    } catch (e) {
      console.error(`Durable Object deleteUser error for ${username}:`, e)
      throw e
    }
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
  
  // Vite/Node 环境回退到内存存储
  return {
    getUser: async (name: string) => memoryUsers.get(name),
    getUsers: async () => Array.from(memoryUsers.values()),
    setUser: async (name: string, data: any) => {
      memoryUsers.set(name, data)
    },
    deleteUser: async (name: string) => {
      memoryUsers.delete(name)
    }
  }
}

// 登录接口
app.post('/auth/login', async (c) => {
  const { username, password } = await c.req.json()
  
  const adminUser = process.env.ADMIN_USERNAME || c.env?.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD || c.env?.ADMIN_PASSWORD

  let user: { username: string, role: 'admin' | 'user' } | null = null
  
  if (adminUser && username === adminUser) {
    // 管理员密码验证
    if (adminPass && (password === adminPass || (adminPass.startsWith('$argon2') && await argon2Verify({ password, hash: adminPass })))) {
      user = { username: adminUser, role: 'admin' }
    }
  } else {
    const storage = getUserDataLayer(c)
    const storedUser = await storage.getUser(username)
    // 确保 storedUser 存在且密码匹配，并且角色必须是 'user'，防止普通用户存储中混入伪造的 admin
    if (storedUser && await argon2Verify({ password, hash: storedUser.password })) {
      user = { 
        username: storedUser.username, 
        role: 'user' // 强制设为 user，所有 admin 必须通过环境变量定义
      }
    }
  }

  if (user) {
    const payload = { ...user, exp: Date.now() + 86400000 }
    const token = btoa(JSON.stringify({})) + '.' + btoa(JSON.stringify(payload)) + '.sig'
    
    // 自动判断是否为开发环境
    const isDev = process.env.NODE_ENV === 'development' || !c.env?.USER_STORAGE;

    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: !isDev, // 开发环境(http)下设为 false，生产环境(https)下设为 true
      sameSite: 'Lax', // 改为 Lax 以提高 Safari 兼容性
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
app.post('/admin/users', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { username, password } = await c.req.json()
    const storage = getUserDataLayer(c)
    
    if (await storage.getUser(username)) {
      return c.json({ error: 'User already exists' }, 400)
    }

    const cryptoObj = (typeof crypto !== 'undefined' ? crypto : (await import('node:crypto')).webcrypto) as any;
    const salt = new Uint8Array(16);
    cryptoObj.getRandomValues(salt);
    
    const hashedPassword = await argon2id({ 
      password, 
      salt,
      parallelism: 1,
      iterations: 2,
      memorySize: 16384,
      hashLength: 32
    })
    
    await storage.setUser(username, { username, password: hashedPassword, role: 'user' })
    return c.json({ success: true })
  } catch (e: any) {
    console.error('Create user error:', e)
    return c.json({ 
      error: 'Internal Server Error', 
      message: e.message,
      stack: e.stack,
      type: e.constructor.name
    }, 500)
  }
})

// 管理员接口：修改用户密码
app.patch('/admin/users/:username', authMiddleware, adminMiddleware, async (c) => {
  const targetUsername = c.req.param('username')
  const { password } = await c.req.json()

  const storage = getUserDataLayer(c)
  const user = await storage.getUser(targetUsername)
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  // 禁止管理员修改其他管理员的密码（如果存在多个管理员）
  if (user.role === 'admin') {
    return c.json({ error: 'Cannot modify admin password via this API' }, 403)
  }

  const cryptoObj = (typeof crypto !== 'undefined' ? crypto : (await import('node:crypto')).webcrypto) as any;
  const salt = new Uint8Array(16);
  cryptoObj.getRandomValues(salt);
  user.password = await argon2id({ 
    password, 
    salt,
    parallelism: 1,
    iterations: 2,
    memorySize: 16384,
    hashLength: 32
  })
  await storage.setUser(targetUsername, user)
  return c.json({ success: true })
})

// 用户接口：修改自己的密码
app.patch('/auth/password', authMiddleware, async (c) => {
  const currentUser = c.get('user')
  const { oldPassword, newPassword } = await c.req.json()

  // 管理员密码存储在环境变量中，不支持通过此接口修改
  const adminUser = process.env.ADMIN_USERNAME || c.env?.ADMIN_USERNAME
  if (currentUser.username === adminUser) {
    return c.json({ error: 'Admin password cannot be changed via this API' }, 403)
  }

  const storage = getUserDataLayer(c)
  const user = await storage.getUser(currentUser.username)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  if (!await argon2Verify({ password: oldPassword, hash: user.password })) {
    return c.json({ error: 'Invalid old password' }, 400)
  }

  const cryptoObj = (typeof crypto !== 'undefined' ? crypto : (await import('node:crypto')).webcrypto) as any;
  const salt = new Uint8Array(16);
  cryptoObj.getRandomValues(salt);
  user.password = await argon2id({ 
    password: newPassword, 
    salt,
    parallelism: 1,
    iterations: 2,
    memorySize: 16384,
    hashLength: 32
  })
  await storage.setUser(currentUser.username, user)
  return c.json({ success: true })
})

// 获取用户同步数据
app.get('/user/sync', authMiddleware, async (c) => {
  const currentUser = c.get('user')
  const storage = getUserDataLayer(c)
  const user = await storage.getUser(currentUser.username)
  return c.json({ data: user?.syncData || null })
})

// 更新用户同步数据
app.post('/user/sync', authMiddleware, async (c) => {
  const currentUser = c.get('user')
  const { data } = await c.req.json()
  const storage = getUserDataLayer(c)
  const user = await storage.getUser(currentUser.username)
  
  if (!user) return c.json({ error: 'User not found' }, 404)
  
  user.syncData = data
  await storage.setUser(currentUser.username, user)
  return c.json({ success: true })
})

// 管理员接口：删除用户
app.delete('/admin/users/:username', authMiddleware, adminMiddleware, async (c) => {
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

app.get('/admin/users', authMiddleware, adminMiddleware, async (c) => {
  try {
    const storage = getUserDataLayer(c)
    const users = await storage.getUsers()
    
    return c.json({ users: users.map((u: any) => ({ username: u.username, role: u.role })) })
  } catch (e: any) {
    console.error('Get users error:', e)
    return c.json({ 
      error: 'Internal Server Error', 
      message: e.message,
      stack: e.stack,
      type: e.constructor.name
    }, 500)
  }
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

// 兜底路由：将所有非 API 请求转发给前端静态资源
app.get('/*', async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw)
  if (res.status === 404) {
    // 如果资源不存在（比如直接访问 /login 路由），则返回 index.html 让前端路由处理
    return await c.env.ASSETS.fetch(new Request(new URL('/', c.req.url)))
  }
  return res
})

export default app
