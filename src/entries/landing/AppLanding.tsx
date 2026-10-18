import React, { useCallback, useEffect, useState } from "react";
import { LanguageProvider } from "@/context/LanguageContext";
import { useSeo } from "@/hooks/useSeo";
import { NOT_FOUND_META, normalizePath, resolveRoute } from "@/routes";
import {
  HomePage,
  LoginPage,
  KatalogPage,
  KatalogDetailPage,
  CaraPesanPage,
  KontakPage,
  KebijakanPage,
  NotFoundPage,
} from "@/pages/landing";

function getInitialPath(): string {
  if (typeof window === "undefined") return "/";
  return normalizePath(window.location.pathname);
}

function LandingRouter() {
  const [path, setPath] = useState<string>(getInitialPath);
  const route = resolveRoute(path);

  useEffect(() => {
    if (route && route.path !== path) {
      window.history.replaceState(null, "", route.path);
      setPath(route.path);
    }
  }, [route, path]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

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
      // Jika menuju ke app dashboard, checkout, atau order dari landing page yang mandiri
      if (to.startsWith("/app") || to.startsWith("/checkout") || to.startsWith("/order")) {
        const host = window.location.hostname;
        const isLocalHost = host === "localhost" || /^[\d.]+$/.test(host) || host.endsWith(".local");
        if (!isLocalHost && !host.startsWith("app.")) {
          // Jika berada di domain utama (mis. satucerita.zanxa.studio), arahkan ke app.satucerita.zanxa.studio
          const rootDomain = host.replace(/^www\./, "");
          const appDomain = `${window.location.protocol}//app.${rootDomain}${window.location.port ? ":" + window.location.port : ""}`;
          const targetPath = to.replace(/^\/app/, "") || "/home";
          window.location.href = `${appDomain}${targetPath}`;
          return;
        } else if (isLocalHost) {
          // Pada lokal/dev environment
          const targetPath = to.startsWith("/app") ? to : `/app${to}`;
          window.location.href = targetPath;
          return;
        }
      }

      const hashIndex = to.indexOf("#");
      const hash = hashIndex >= 0 ? to.slice(hashIndex) : "";
      const next = to.startsWith("#") ? path : normalizePath(to);

      if (hash && next === path) {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
        return;
      }

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
    case "katalogDetail":
      return <KatalogDetailPage currentPath={path} onNavigate={navigate} />;
    case "caraPesan":
      return <CaraPesanPage currentPath={path} onNavigate={navigate} />;
    case "kontak":
      return <KontakPage currentPath={path} onNavigate={navigate} />;
    case "kebijakan":
      return <KebijakanPage currentPath={path} onNavigate={navigate} />;
    default:
      return <NotFoundPage currentPath={path} onNavigate={navigate} />;
  }
}

export function AppLanding() {
  return (
    <LanguageProvider>
      <div className="min-h-screen min-h-[100dvh] w-full overflow-x-clip bg-background text-text-primary flex flex-col font-sans selection:bg-[#7d6aee]/20 selection:text-[#7d6aee]">
        <div id="main-content-container" className="flex-1 w-full">
          <LandingRouter />
        </div>
      </div>
    </LanguageProvider>
  );
}

export default AppLanding;
