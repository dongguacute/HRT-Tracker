import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'

export type UserPayload = {
  username: string
  role: 'admin' | 'user'
  exp: number
}

export const authMiddleware = async (c: Context<any>, next: Next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as UserPayload
    
    // 检查 Token 是否过期
    if (payload.exp && Date.now() > payload.exp) {
      return c.json({ error: 'Token expired' }, 401)
    }

    c.set('user', payload)
    await next()
  } catch (e) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

export const adminMiddleware = async (c: Context<any>, next: Next) => {
  const user = c.get('user') as UserPayload
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403)
  }
  await next()
}
