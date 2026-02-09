import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'jarvis_session';
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }
  
  // Allow Next.js internals
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Check for valid session cookie
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  
  // Check for valid API token
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const validTokens = (process.env.API_TOKENS || '').split(',').filter(Boolean);
  const hasValidToken = token && validTokens.length > 0 && validTokens.includes(token);
  
  // Allow if has valid session OR valid token
  if (session || hasValidToken) {
    return NextResponse.next();
  }
  
  // API routes return 401
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // UI routes redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
