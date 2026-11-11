import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

/** Magic-link landing: exchanges the one-time code for a session, then opens the app. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  if (code) {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL('/login?error=link', url.origin));
}
