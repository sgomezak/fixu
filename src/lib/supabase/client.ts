'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseEnabled, supabaseKey, supabaseUrl } from './config';

let client: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient | null {
  if (!supabaseEnabled) return null;
  client ??= createBrowserClient(supabaseUrl, supabaseKey);
  return client;
}
