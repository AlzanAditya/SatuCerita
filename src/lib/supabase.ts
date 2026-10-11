/**
 * Supabase Client Configuration untuk Satu Cerita
 *
 * Mengambil URL dan Anon Key dari environment variable:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const SUPABASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_SUPABASE_URL) ||
  "https://xyzcompany.supabase.co";

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  "public-anon-key";
