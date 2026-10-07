import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const PUBLIC_EXACT_PATHS = new Set([
  '/',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
  '/blog',
  '/api/workflows/cron',
  '/api/workflows/execute',
  '/api/webhooks/stripe',
]);

function isAuthPath(pathname: string): boolean {
  return pathname === '/sign-in' ||
    pathname.startsWith('/sign-in/') ||
    pathname === '/sign-up' ||
    pathname.startsWith('/sign-up/');
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_EXACT_PATHS.has(pathname) || isAuthPath(pathname);
}

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    if (userId && (pathname === '/' || isAuthPath(pathname))) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    return NextResponse.next();
  }

  await auth.protect();
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
