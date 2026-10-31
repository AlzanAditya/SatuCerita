/**
 * URL lintas aplikasi (landing / app / dash).
 * - Lokal (localhost / IP): satu origin, pakai path (/login, /app/home, /dash).
 * - Produksi: subdomain (satucerita.<domain>, app.<domain>, dash.<domain>).
 */
const loc = () => (typeof window !== "undefined" ? window.location : null);

export function isLocal(): boolean {
  const l = loc();
  return !!l && (l.hostname === "localhost" || /^[\d.]+$/.test(l.hostname) || l.hostname.endsWith(".local"));
}

export function origin(sub: "" | "app" | "studio" | "dash"): string {
  const l = loc();
  if (!l) return "";
  const root = l.hostname.replace(/^(app|studio|dash)\./, "");
  return `${l.protocol}//${sub ? sub + "." : ""}${root}${l.port ? ":" + l.port : ""}`;
}

export const urls = {
  landing: (path = "") => (isLocal() ? path || "/" : `${origin("")}${path || ""}`),
  katalog: () => (isLocal() ? "/katalog" : `${origin("")}/katalog`),
  katalogDetail: (slug: string) => (isLocal() ? `/katalog/${slug}` : `${origin("")}/katalog/${slug}`),
  login: () => (isLocal() ? "/login" : `${origin("")}/login`),
  signup: () => (isLocal() ? "/signup" : `${origin("")}/signup`),
  appHome: () => (isLocal() ? "/app/home" : `${origin("studio")}/home`),
  appPesanan: () => (isLocal() ? "/app/pesanan" : `${origin("studio")}/pesanan`),
  appProses: () => (isLocal() ? "/app/pesanan" : `${origin("studio")}/pesanan`),
  appProfile: () => (isLocal() ? "/app/profile" : `${origin("studio")}/profile`),
  appCheckout: (slug: string) => (isLocal() ? `/app/checkout/${slug}` : `${origin("studio")}/checkout/${slug}`),
  appOrder: (invoice: string) => (isLocal() ? `/app/order/${invoice}` : `${origin("studio")}/order/${invoice}`),
  dashLogin: () => (isLocal() ? "/dash/login" : `${origin("dash")}/login`),
  dashHome: () => (isLocal() ? "/dash" : `${origin("dash")}/overview`),
};
