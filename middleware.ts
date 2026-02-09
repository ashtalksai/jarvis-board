import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'jarvis_session';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/api/auth/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Allow static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }
  
  // Check if auth is enabled
  // Note: In production, always require auth even if env vars missing
  const authPass = process.env.AUTH_PASS;
  const apiTokens = process.env.API_TOKENS;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check API token for API routes
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const tokens = (apiTokens || '').split(',').filter(Boolean);
      
      if (tokens.length === 0 || tokens.includes(token)) {
        return NextResponse.next();
      }
    }
    
    // Also allow session cookie for API (browser fetch)
    const sessionCookie = request.cookies.get(SESSION_COOKIE);
    if (sessionCookie?.value) {
      return NextResponse.next();
    }
    
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Check session cookie for UI routes
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  
  if (!sessionCookie?.value) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
