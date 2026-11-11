export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
/** False in local/demo builds without Supabase env vars: the app then keeps data in the browser. */
export const supabaseEnabled = Boolean(supabaseUrl && supabaseKey);
