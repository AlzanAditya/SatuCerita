import React, { useCallback, useEffect, useState } from "react";
import { LanguageProvider } from "@/context/LanguageContext";
import { UserApp } from "@/pages/app/UserApp";
import { SITE } from "@/config/site";
import { AuthGate } from "@/components/auth/AuthGate";

type TabType =
  | "home"
  | "task"
  | "proses"
  | "chat"
  | "app"
  | "joki"
  | "katalog"
  | "profile"
  | "bayar";

function pathToTab(pathname: string): TabType {
  const p = pathname.toLowerCase();
  if (p.includes("proses") || p.includes("pesanan") || p.includes("bayar") || p.includes("task")) {
    return "proses";
  }
  if (p.includes("profile") || p.includes("profil")) {
    return "profile";
  }
  if (p.includes("katalog")) {
    return "katalog";
  }
  return "home";
}

function tabToPath(tab: TabType): string {
  switch (tab) {
    case "proses":
    case "bayar":
    case "task":
      return "/proses";
    case "profile":
      return "/profile";
    case "katalog":
      return "/katalog";
    default:
      return "/home";
  }
}

export function AppUser() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === "undefined") return "/home";
    return window.location.pathname || "/home";
  });

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window === "undefined") return "home";
    return pathToTab(window.location.pathname);
  });

  // Sinkronkan browser history saat tab berubah
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
      // Jika user klik logout atau kembali ke landing page
      if (to === "/" || to === "/login" || to === "/cara-pesan" || to === "/kontak" || to === "/kebijakan") {
        const host = window.location.hostname;
        const landingDomain = host.startsWith("app.")
          ? `${window.location.protocol}//${host.replace(/^app\./, "")}`
          : (SITE.url || "https://satucerita.id");
        window.location.href = `${landingDomain}${to === "/" ? "" : to}`;
        return;
      }

      const nextTab = pathToTab(to);
      const targetPath = tabToPath(nextTab);

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
