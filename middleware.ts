import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/', // landing page is public
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
  '/blog',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/workflows/(.*)*',
  '/api/webhooks/stripe',
]);

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = auth();

  // If the route is public, allow it but redirect logged-in users away from landing/auth pages
  if (isPublicRoute(request)) {
    const pathname = request.nextUrl.pathname;

    // Redirect authenticated users from landing and auth pages to dashboard
    if (userId && (pathname === '/' || isAuthRoute(request))) {
      const url = new URL('/home', request.url);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // Protect all other routes
  await auth().protect();
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
