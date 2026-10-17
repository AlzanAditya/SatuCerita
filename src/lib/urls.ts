/**
 * URL lintas aplikasi (landing / app / dash).
 * - Lokal (localhost / IP): satu origin, pakai path (/login, /app/home, /dash).
 * - Produksi: subdomain (app.<root>, dash.<root>).
 */
const loc = () => (typeof window !== "undefined" ? window.location : null);

function isLocal(): boolean {
  const l = loc();
  return !!l && (l.hostname === "localhost" || /^[\d.]+$/.test(l.hostname) || l.hostname.endsWith(".local"));
}

function origin(sub: "" | "app" | "dash"): string {
  const l = loc();
  if (!l) return "";
  const root = l.hostname.replace(/^(app|dash)\./, "");
  return `${l.protocol}//${sub ? sub + "." : ""}${root}${l.port ? ":" + l.port : ""}`;
}

export const urls = {
  login: () => (isLocal() ? "/login" : `${origin("")}/login`),
  appHome: () => (isLocal() ? "/app/home" : `${origin("app")}/home`),
  dashLogin: () => (isLocal() ? "/dash/login" : `${origin("dash")}/login`),
  dashHome: () => (isLocal() ? "/dash" : `${origin("dash")}/overview`),
};
