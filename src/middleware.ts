import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip auth for health checks and static files
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check for API token in Authorization header
  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const validTokens = process.env.API_TOKENS?.split(',') || [];

    if (validTokens.includes(token)) {
      return NextResponse.next();
    }

    return NextResponse.json(
      { error: 'Invalid API token' },
      { status: 401 }
    );
  }

  // If no Bearer token, allow through (nginx handles Basic Auth)
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
