import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseEnabled, supabaseKey, supabaseUrl } from '@/lib/supabase/config';

const PUBLIC = ['/login', '/auth/'];

/** Refreshes the Supabase session and sends signed-out visitors to /login. */
export async function middleware(request: NextRequest) {
  if (!supabaseEnabled) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(p));

  if (!user && !isPublic) {
    if (path.startsWith('/api/')) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = path === '/' ? '' : `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  if (user && path === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Skip static files, icons, the manifest and the service worker.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|logo-mark.svg|apple-touch-icon.png|icon-.*\\.png|manifest.webmanifest|sw.js|swe-worker-.*\\.js).*)'],
};
