import { useEffect, useSyncExternalStore } from "react";
import { getCachedSession, refreshSession, subscribeSession, type SessionUser } from "@/lib/auth";

/**
 * Sesi user untuk komponen layout (Navbar/BottomNav).
 * Nilai awal diambil dari cache modul, jadi tidak berkedip saat pindah halaman.
 */
export function useSession(): SessionUser | null {
  const cached = useSyncExternalStore(subscribeSession, getCachedSession, () => undefined);
  useEffect(() => {
    void refreshSession();
  }, []);
  return cached ?? null;
}
