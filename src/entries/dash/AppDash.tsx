import React, { useCallback, useState } from "react";
import { LanguageProvider } from "@/context/LanguageContext";
import { AdminDash } from "@/pages/dash/AdminDash";
import { SITE } from "@/config/site";

export function AppDash() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === "undefined") return "/";
    return window.location.pathname || "/";
  });

  const handleNavigate = useCallback((to: string) => {
    if (to === "/" || to.startsWith("http")) {
      const siteUrl = SITE.url || "https://satucerita.zanxa.studio";
      if (to === "/" && window.location.hostname !== new URL(siteUrl).hostname) {
        window.location.href = siteUrl;
        return;
      }
    }
    window.history.pushState(null, "", to);
    setCurrentPath(to);
  }, []);

  return (
    <LanguageProvider>
      <div className="min-h-screen w-full overflow-x-clip bg-background text-text-primary flex flex-col font-sans selection:bg-[#7d6aee]/20 selection:text-[#7d6aee]">
        <div id="main-content-container" className="flex-1 w-full">
          <AdminDash
            currentPath={currentPath}
            onNavigate={handleNavigate}
          />
        </div>
      </div>
    </LanguageProvider>
  );
}

export default AppDash;
