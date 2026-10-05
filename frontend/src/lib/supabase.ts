import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const oauthEnabled = Boolean(
  url && key && !url.includes('your-project') && key !== 'your-anon-key'
);
export const supabase = oauthEnabled ? createClient(url, key) : null;
