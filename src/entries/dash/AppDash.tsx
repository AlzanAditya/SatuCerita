import React, { useCallback, useEffect, useState } from "react";
import { LanguageProvider } from "@/context/LanguageContext";
import { AdminDash, DashTabType, pathToDashTab, dashTabToPath } from "@/pages/dash/AdminDash";
import { DashLoginPage } from "@/pages/dash/DashLoginPage";
import { SITE } from "@/config/site";
import { AuthGate } from "@/components/auth/AuthGate";
import { urls } from "@/lib/urls";

export function AppDash() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === "undefined") return "/overview";
    const p = window.location.pathname;
    return p === "/" ? "/overview" : p;
  });

  const [activeTab, setActiveTab] = useState<DashTabType | "login">(() => {
    if (typeof window === "undefined") return "overview";
    const p = window.location.pathname.toLowerCase();
    if (p.includes("login")) return "login";
    return pathToDashTab(p);
  });

  // Sinkronkan browser history saat tombol Back / Forward ditekan
  useEffect(() => {
    const onPopState = () => {
      const p = window.location.pathname;
      setCurrentPath(p);
      if (p.toLowerCase().includes("login")) {
        setActiveTab("login");
      } else {
        setActiveTab(pathToDashTab(p));
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleNavigate = useCallback((to: string) => {
    // Jika user klik link eksternal atau kembali ke landing page utama
    if (to === "/" && window.location.pathname !== "/") {
      const isStandaloneDash =
        window.location.hostname.startsWith("dash.");
      if (isStandaloneDash) {
        window.location.href = urls.landing();
        return;
      }
    }

    if (to.startsWith("http")) {
      window.location.href = to;
      return;
    }

    const cleanPath = to.toLowerCase();
    let nextTab: DashTabType | "login";
    let targetUrl: string;

    const isStandalone =
      window.location.hostname.startsWith("dash.") ||
      !window.location.pathname.startsWith("/dash");

    if (cleanPath.includes("login")) {
      nextTab = "login";
      targetUrl = isStandalone ? "/login" : "/dash/login";
    } else {
      nextTab = pathToDashTab(to);
      targetUrl = dashTabToPath(nextTab, isStandalone);
    }

    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, "", targetUrl);
    }

    setCurrentPath(targetUrl);
    setActiveTab(nextTab);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const isLoginPage =
    activeTab === "login" ||
    currentPath.toLowerCase().includes("login");

  return (
    <LanguageProvider>
      <div className="min-h-screen w-full overflow-x-clip bg-background text-text-primary flex flex-col font-sans selection:bg-[#7d6aee]/20 selection:text-[#7d6aee]">
        <div id="main-content-container" className="flex-1 w-full">
          {isLoginPage ? (
            <DashLoginPage
              currentPath={currentPath}
              onNavigate={handleNavigate}
            />
          ) : (
            <AuthGate require="admin">
              <AdminDash
                activeTab={activeTab as DashTabType}
                currentPath={currentPath}
                onNavigate={handleNavigate}
              />
            </AuthGate>
          )}
        </div>
      </div>
    </LanguageProvider>
  );
}

export default AppDash;
