import React, { useCallback, useEffect, useState } from "react";
import { LanguageProvider } from "@/context/LanguageContext";
import { UserApp } from "@/pages/app/UserApp";
import { AuthGate } from "@/components/auth/AuthGate";
import { SITE } from "@/config/site";

export type TabType = "home" | "proses" | "profile" | "checkout" | "order";

function isLandingPath(path: string): boolean {
  const p = (path || "/").toLowerCase().split("?")[0].split("#")[0];
  return (
    p === "/" ||
    p === "/login" ||
    p === "/signup" ||
    p === "/cara-pesan" ||
    p === "/kontak" ||
    p === "/kebijakan" ||
    p === "/katalog" ||
    p.startsWith("/katalog/")
  );
}

function pathToTab(pathname: string): TabType {
  const p = pathname.toLowerCase();
  if (p.includes("/checkout")) {
    return "checkout";
  }
  if (p.includes("/order")) {
    return "order";
  }
  if (p.includes("pesanan") || p.includes("proses") || p.includes("bayar") || p.includes("task")) {
    return "proses";
  }
  if (p.includes("profile") || p.includes("profil")) {
    return "profile";
  }
  return "home";
}

function tabToPath(tab: TabType, fullPath = ""): string {
  switch (tab) {
    case "checkout":
      return fullPath.replace(/^\/app/, "") || "/checkout";
    case "order":
      return fullPath.replace(/^\/app/, "") || "/order";
    case "proses":
      return "/pesanan";
    case "profile":
      return "/profile";
    case "home":
    default:
      return "/home";
  }
}

export function AppUser() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === "undefined") return "/home";
    const p = window.location.pathname || "/home";
    // Jika akses root di subdomain app (app.satucerita.id/), arahkan ke /home
    return p === "/" ? "/home" : p;
  });

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window === "undefined") return "home";
    return pathToTab(window.location.pathname);
  });

  // Sinkronkan browser history saat tab / URL berubah
  useEffect(() => {
    const onPopState = () => {
      const p = window.location.pathname;
      setCurrentPath(p);
      setActiveTab(pathToTab(p));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleNavigate = useCallback(
    (to: string) => {
      // 1. Jika tujuan adalah halaman landing (katalog, kontak, login, beranda, dll)
      if (isLandingPath(to)) {
        const host = window.location.hostname;
        const isLocal =
          host === "localhost" || /^[\d.]+$/.test(host) || host.endsWith(".local");

        if (!isLocal && host.startsWith("app.")) {
          // Produksi: arahkan ke domain utama satucerita.zanxa.studio / satucerita.id
          const rootDomain = host.replace(/^app\./, "");
          const landingDomain = `${window.location.protocol}//${rootDomain}${
            window.location.port ? ":" + window.location.port : ""
          }`;
          const targetUrl = `${landingDomain}${to.startsWith("/") ? to : "/" + to}`;
          window.location.href = targetUrl;
          return;
        } else if (isLocal) {
          // Lokal dev / port tunggal
          window.location.href = to.startsWith("/") ? to : "/" + to;
          return;
        }
      }

      // 2. Navigasi internal di app (home, pesanan, profile, checkout, order)
      const nextTab = pathToTab(to);
      const cleanPath = to.replace(/^\/app/, "") || "/home";
      const targetPath =
        nextTab === "checkout" || nextTab === "order"
          ? cleanPath
          : tabToPath(nextTab, cleanPath);

      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, "", targetPath);
      }
      setCurrentPath(targetPath);
      setActiveTab(nextTab);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    },
    []
  );

  return (
    <LanguageProvider>
      <div className="min-h-screen w-full overflow-x-clip bg-background text-text-primary flex flex-col font-sans selection:bg-[#7d6aee]/20 selection:text-[#7d6aee]">
        <div id="main-content-container" className="flex-1 w-full">
          <AuthGate require="user">
            <UserApp
              activeTab={activeTab}
              currentPath={currentPath}
              onNavigate={handleNavigate}
            />
          </AuthGate>
        </div>
      </div>
    </LanguageProvider>
  );
}

export default AppUser;
