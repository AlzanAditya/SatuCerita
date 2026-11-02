export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string; // secret
  ADMIN_EMAIL: string;
  ENVIRONMENT: string;
  DEV_ORIGIN?: string;
  COOKIE_DOMAIN?: string;
  ALLOWED_ORIGINS: string;
  LOGIN_URL: string;
  APP_HOME_URL: string;
  STUDIO_HOME_URL?: string;
  DASH_LOGIN_URL: string;
  DASH_HOME_URL: string;

  // ---- Pembayaran (Midtrans) ----
  MIDTRANS_ENV: string;             // "sandbox" | "production"
  MIDTRANS_CLIENT_KEY: string;      // publik; dipakai Core API hanya jika metode butuh (tokenisasi kartu). Tidak dikirim ke browser.
  MIDTRANS_SERVER_KEY: string;      // SECRET -> wrangler secret put MIDTRANS_SERVER_KEY
  SUPABASE_SERVICE_ROLE_KEY: string; // SECRET -> wrangler secret put SUPABASE_SERVICE_ROLE_KEY
  RL_ORDERS?: RateLimit;            // binding rate limit (opsional; lihat wrangler config)
  RL_SYNC?: RateLimit;
  RL_STREAM?: RateLimit;            // batas pembukaan koneksi SSE per user
  PAYMENT_HUB?: DurableObjectNamespace; // hub realtime (Durable Object). Tanpa binding -> klien memakai fallback polling DB.
}

export interface SbUser {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  created_at?: string;
  app_metadata?: { provider?: string; providers?: string[] };
  user_metadata?: Record<string, unknown>;
  identities?: { provider: string }[];
}

export interface SbSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: SbUser;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  phone: string;
  role: "user" | "admin";
  createdAt: string;
}
