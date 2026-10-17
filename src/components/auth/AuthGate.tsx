import React, { useCallback, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { fetchSession, logoutRequest, type Role, type SessionUser } from "@/lib/auth";
import { urls } from "@/lib/urls";

type State = { status: "loading" } | { status: "guest" } | { status: "authed"; user: SessionUser };

const Spinner = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-white">
    <div className="size-9 rounded-full border-4 border-[#ad9fff]/40 border-t-[#7d6aee] animate-spin" aria-label="Memuat" />
  </div>
);

/**
 * Guard sisi client (UX). Pengaman utama tetap di Worker (halaman) dan API (data).
 * - require="user"  : harus login
 * - require="admin" : harus login sebagai admin
 */
export const AuthGate: React.FC<{ require: Role; children: React.ReactNode }> = ({ require, children }) => {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    fetchSession().then((user) => {
      if (alive) setState(user ? { status: "authed", user } : { status: "guest" });
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (state.status === "guest") window.location.replace(require === "admin" ? urls.dashLogin() : urls.login());
  }, [state.status, require]);

  const signOut = useCallback(async () => {
    await logoutRequest();
  }, []);

  if (state.status !== "authed") return <Spinner />;

  if (require === "admin" && state.user.role !== "admin") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white p-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-black text-neutral-900">Akses ditolak</h1>
          <p className="mt-2 text-sm text-neutral-500">Akun ini tidak memiliki akses ke dashboard admin.</p>
          <button
            type="button"
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#7d6aee] text-white text-sm font-bold cursor-pointer"
            onClick={async () => {
              await logoutRequest();
              window.location.replace(urls.dashLogin());
            }}
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user: state.user, setUser: (u) => setState({ status: "authed", user: u }), signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthGate;
