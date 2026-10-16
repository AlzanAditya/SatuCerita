import React, { useCallback, useEffect, useState } from "react";
import { LanguageProvider } from "@/context/LanguageContext";
import { useSeo } from "@/hooks/useSeo";
import { NOT_FOUND_META, normalizePath, resolveRoute } from "@/routes";
import {
  HomePage,
  LoginPage,
  KatalogPage,
  CaraPesanPage,
  KontakPage,
  KebijakanPage,
  NotFoundPage,
} from "@/pages/landing";
import { UserApp } from "@/pages/app";
import { AdminDash, DashLoginPage } from "@/pages/dash";

function getInitialPath(): string {
  if (typeof window === "undefined") return "/";
  return normalizePath(window.location.pathname);
}

function AppRouter() {
  const [path, setPath] = useState<string>(getInitialPath);
  const route = resolveRoute(path);

  // Alias (mis. /carapesan, /app) -> ganti URL ke path kanonik.
  useEffect(() => {
    if (route && route.path !== path) {
      window.history.replaceState(null, "", route.path);
      setPath(route.path);
    }
  }, [route, path]);

  // Biarkan SPA yang mengatur scroll, bukan browser.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Tombol back / forward browser.
  useEffect(() => {
    const onPopState = () => {
      setPath(normalizePath(window.location.pathname));
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback(
    (to: string) => {
      const hashIndex = to.indexOf("#");
      const hash = hashIndex >= 0 ? to.slice(hashIndex) : "";
      const next = to.startsWith("#") ? path : normalizePath(to);

      // Link anchor di halaman yang sama.
      if (hash && next === path) {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
        return;
      }

      // Halaman yang sama -> cukup scroll ke atas.
      if (next === path) {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        return;
      }

      window.history.pushState(null, "", next + hash);
      setPath(next);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

      if (hash) {
        setTimeout(
          () => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }),
          50
        );
      }
    },
    [path]
  );

  // Metadata SEO dibaca dari src/routes.ts (sumber yang sama dengan SSG).
  useSeo({
    title: route?.title ?? NOT_FOUND_META.title,
    description: route?.description ?? NOT_FOUND_META.description,
    path: route?.path ?? path,
    noindex: route ? !route.indexable : true,
  });

  switch (route?.id) {
    case "home":
      return <HomePage currentPath={path} onNavigate={navigate} />;
    case "login":
    case "signup":
      return <LoginPage currentPath={path} onNavigate={navigate} />;
    case "katalog":
      return <KatalogPage currentPath={path} onNavigate={navigate} />;
    case "caraPesan":
      return <CaraPesanPage currentPath={path} onNavigate={navigate} />;
    case "kontak":
      return <KontakPage currentPath={path} onNavigate={navigate} />;
    case "kebijakan":
      return <KebijakanPage currentPath={path} onNavigate={navigate} />;
    case "appHome":
      return <UserApp activeTab="home" currentPath={path} onNavigate={navigate} />;
    case "appProses":
      return <UserApp activeTab="proses" currentPath={path} onNavigate={navigate} />;
    case "appProfile":
      return <UserApp activeTab="profile" currentPath={path} onNavigate={navigate} />;
    case "dashLogin":
      return <DashLoginPage currentPath={path} onNavigate={navigate} />;
    case "dashCustomer":
      return <AdminDash activeTab="users" currentPath={path} onNavigate={navigate} />;
    case "dashAnalytics":
      return <AdminDash activeTab="analytics" currentPath={path} onNavigate={navigate} />;
    case "dashFinance":
      return <AdminDash activeTab="finance" currentPath={path} onNavigate={navigate} />;
    case "dashTemplates":
      return <AdminDash activeTab="templates" currentPath={path} onNavigate={navigate} />;
    case "dashInvitations":
      return <AdminDash activeTab="invitations" currentPath={path} onNavigate={navigate} />;
    case "dashSettings":
      return <AdminDash activeTab="settings" currentPath={path} onNavigate={navigate} />;
    case "dash":
      return <AdminDash activeTab="overview" currentPath={path} onNavigate={navigate} />;
    default:
      return <NotFoundPage currentPath={path} onNavigate={navigate} />;
  }
}

export default function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen w-full overflow-x-clip bg-background text-text-primary flex flex-col font-sans selection:bg-[#7d6aee]/20 selection:text-[#7d6aee]">
        <div id="main-content-container" className="flex-1 w-full">
          <AppRouter />
        </div>
      </div>
    </LanguageProvider>
  );
}
