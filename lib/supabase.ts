import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Browser client — for reading posts in the frontend
export const supabase = createClient(url, anon);

// Server client — for agents writing/updating posts (full access)
export const supabaseAdmin = createClient(url, service);