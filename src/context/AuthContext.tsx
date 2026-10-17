import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/auth";

export interface AuthContextValue {
  user: SessionUser;
  setUser: (u: SessionUser) => void;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthGate>.");
  return ctx;
}
