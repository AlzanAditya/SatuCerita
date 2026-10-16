/**
 * Cache Management Utility untuk Satu Cerita (Landing, App, & Dash).
 *
 * Mengamankan penyimpanan data ke localStorage/sessionStorage dengan:
 * - Fallback in-memory jika localStorage tidak tersedia (private mode / sandboxed iframe).
 * - Caching foto profil (dalam format Data URL base64) agar tidak hilang saat reload.
 * - Caching nomor WhatsApp, nama, konfigurasi rekening, dan sesi login admin & user.
 * - Broadcast event agar komponen lain langsung tersinkronisasi saat cache berubah.
 */

const memoryStore: Record<string, string> = {};

export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__sc_cache_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (_e) {
    return false;
  }
}

/**
 * Mengambil nilai dari cache dengan fallback nilai bawaan (defaultValue).
 */
export function getCache<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    let raw: string | null = null;
    if (isStorageAvailable()) {
      raw = window.localStorage.getItem(key);
    } else {
      raw = memoryStore[key] || null;
    }

    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Cache] Gagal membaca key "${key}":`, err);
    return defaultValue;
  }
}

/**
 * Menyimpan nilai ke cache dan broadcast perubahan ke window listeners.
 */
export function setCache<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(value);
    if (isStorageAvailable()) {
      window.localStorage.setItem(key, serialized);
    } else {
      memoryStore[key] = serialized;
    }

    // Trigger local event agar tab atau komponen lain langsung update
    window.dispatchEvent(
      new CustomEvent("satucerita_cache_updated", {
        detail: { key, value },
      })
    );
  } catch (err) {
    console.warn(`[Cache] Gagal menulis key "${key}":`, err);
  }
}

/**
 * Menghapus cache spesifik.
 */
export function removeCache(key: string): void {
  if (typeof window === "undefined") return;
  try {
    if (isStorageAvailable()) {
      window.localStorage.removeItem(key);
    }
    delete memoryStore[key];
    window.dispatchEvent(
      new CustomEvent("satucerita_cache_updated", {
        detail: { key, value: null },
      })
    );
  } catch (_e) {}
}

/**
 * Konversi file gambar (dari input file) menjadi Data URL (base64)
 * agar tersimpan permanen di cache lokal browser.
 */
export function convertFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// TYPED CACHE SCHEMAS & DEFAULT VALUES
// ============================================================================

export interface UserProfileData {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  memberSince: string;
}

export const DEFAULT_USER_PROFILE: UserProfileData = {
  name: "Alzan Bella",
  email: "alzanaditya2@gmail.com",
  phone: "+62 851-8797-8443",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  memberSince: "Oktober 2026",
};

export interface AdminProfileData {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
}

export const DEFAULT_ADMIN_PROFILE: AdminProfileData = {
  name: "Admin",
  email: "zanxastudio@gmail.com",
  phone: "+62 851-8797-8443",
  role: "Admin",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
};

export interface AdminSettingsData {
  bankBca: string;
  qrisNmid: string;
  waGatewayNumber: string;
  autoApproveQris: boolean;
  notifyOnNewOrder: boolean;
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettingsData = {
  bankBca: "882-019-4821 a.n PT SATU CERITA DIGITAL",
  qrisNmid: "NMID: ID1020304958291",
  waGatewayNumber: "+62 851-8797-8443",
  autoApproveQris: true,
  notifyOnNewOrder: true,
};

// CACHE KEYS ENUM
export const CACHE_KEYS = {
  USER_PROFILE: "satucerita_user_profile",
  ADMIN_PROFILE: "satucerita_admin_profile",
  ADMIN_SETTINGS: "satucerita_admin_settings",
  ADMIN_USERS: "satucerita_admin_users",
  ADMIN_ORDERS: "satucerita_admin_orders",
  ADMIN_TEMPLATES: "satucerita_admin_templates",
  ADMIN_INVITATIONS: "satucerita_admin_invitations",
  DASH_AUTH: "satucerita_dash_authenticated",
  USER_INVITATIONS: "satucerita_invitations_v2",
  USER_ORDERS: "satucerita_orders_v2",
  APP_ACTIVE_TAB: "satucerita_app_active_tab",
  DASH_ACTIVE_TAB: "satucerita_dash_active_tab",
} as const;

export function getUserProfileCache(): UserProfileData {
  return getCache<UserProfileData>(CACHE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE);
}

export function saveUserProfileCache(data: Partial<UserProfileData>): UserProfileData {
  const current = getUserProfileCache();
  const merged = { ...current, ...data };
  setCache(CACHE_KEYS.USER_PROFILE, merged);
  return merged;
}

export function getAdminProfileCache(): AdminProfileData {
  const profile = getCache<AdminProfileData>(CACHE_KEYS.ADMIN_PROFILE, DEFAULT_ADMIN_PROFILE);
  if (profile.name === "Alzan Bella (Super Admin)" || profile.name === "Alzan Bella") {
    profile.name = "Admin";
  }
  if (!profile.email || profile.email === "admin@satucerita.id") {
    profile.email = "zanxastudio@gmail.com";
  }
  return profile;
}

export function saveAdminProfileCache(data: Partial<AdminProfileData>): AdminProfileData {
  const current = getAdminProfileCache();
  const merged = { ...current, ...data };
  setCache(CACHE_KEYS.ADMIN_PROFILE, merged);
  return merged;
}

export function getAdminSettingsCache(): AdminSettingsData {
  return getCache<AdminSettingsData>(CACHE_KEYS.ADMIN_SETTINGS, DEFAULT_ADMIN_SETTINGS);
}

export function saveAdminSettingsCache(data: Partial<AdminSettingsData>): AdminSettingsData {
  const current = getAdminSettingsCache();
  const merged = { ...current, ...data };
  setCache(CACHE_KEYS.ADMIN_SETTINGS, merged);
  return merged;
}

export function isDashAuthenticated(): boolean {
  return getCache<boolean>(CACHE_KEYS.DASH_AUTH, true); // default true for preview
}

export function setDashAuthenticated(isAuth: boolean): void {
  setCache<boolean>(CACHE_KEYS.DASH_AUTH, isAuth);
}
