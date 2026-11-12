export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
/**
 * Sign-in and Supabase storage are on only when NEXT_PUBLIC_FIXU_AUTH=on (and the keys are set).
 * Off: the app opens without sign-in and the calendar keeps its data in the browser.
 */
export const supabaseEnabled = Boolean(supabaseUrl && supabaseKey && process.env.NEXT_PUBLIC_FIXU_AUTH === 'on');
