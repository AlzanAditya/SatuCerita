/**
 * URL lintas aplikasi (landing / app / dash).
 * - Lokal (localhost / IP): satu origin, pakai path (/login, /studio/home, /dash).
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
  studioHome: () => (isLocal() ? "/studio/home" : `${origin("studio")}/home`),
  studioPesanan: () => (isLocal() ? "/studio/pesanan" : `${origin("studio")}/pesanan`),
  studioProses: () => (isLocal() ? "/studio/pesanan" : `${origin("studio")}/pesanan`),
  studioProfile: () => (isLocal() ? "/studio/profile" : `${origin("studio")}/profile`),
  studioCheckout: (slug: string) => (isLocal() ? `/studio/checkout/${slug}` : `${origin("studio")}/checkout/${slug}`),
  studioOrder: (invoice: string) => (isLocal() ? `/studio/order/${invoice}` : `${origin("studio")}/order/${invoice}`),
  dashLogin: () => (isLocal() ? "/dash/login" : `${origin("dash")}/login`),
  dashHome: () => (isLocal() ? "/dash" : `${origin("dash")}/overview`),
};
