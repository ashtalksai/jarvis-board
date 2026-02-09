import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'jarvis_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Simple session token - in production use proper JWT or database sessions
function generateSessionToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
}

// Validate credentials
export function validateCredentials(username: string, password: string): boolean {
  const validUser = process.env.AUTH_USER || 'admin';
  const validPass = process.env.AUTH_PASS;
  
  if (!validPass) {
    console.warn('AUTH_PASS not set - authentication disabled');
    return true;
  }
  
  return username === validUser && password === validPass;
}

// Check if API token is valid
export function validateApiToken(token: string): boolean {
  const tokens = (process.env.API_TOKENS || '').split(',').filter(Boolean);
  
  if (tokens.length === 0) {
    console.warn('API_TOKENS not set - API authentication disabled');
    return true;
  }
  
  return tokens.includes(token);
}

// Create session (set cookie)
export async function createSession(): Promise<string> {
  const token = generateSessionToken();
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  
  return token;
}

// Check session (from cookie)
export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

// Destroy session
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Check if request is authenticated (for middleware)
export function isAuthenticated(request: NextRequest): boolean {
  // Check API token first (for programmatic access)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return validateApiToken(token);
  }
  
  // Check session cookie (for browser access)
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  if (sessionCookie?.value) {
    // Simple check - cookie exists and has value
    // In production, validate against database/redis
    return true;
  }
  
  // No auth configured = allow all
  if (!process.env.AUTH_PASS && !process.env.API_TOKENS) {
    return true;
  }
  
  return false;
}

// Check if auth is enabled
export function isAuthEnabled(): boolean {
  return !!(process.env.AUTH_PASS || process.env.API_TOKENS);
}
