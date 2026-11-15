import type { Language } from "@/context/LanguageContext";
import { NOT_FOUND_META, type RouteMeta } from "@/routes";

/**
 * Metadata SEO bahasa Inggris untuk route landing (dipakai useSeo di sisi client).
 * HTML statis hasil SSG tetap Bahasa Indonesia (default untuk crawler).
 */
interface Meta {
  title: string;
  description: string;
}

const EN_BY_ID: Record<string, Meta> = {
  home: {
    title:
      "Satu Cerita - Make Special Moments More Memorable | Digital Invitation & Event Platform",
    description:
      "Deliver a standout invitation and share your special moments. Satu Cerita is a modern SaaS platform for digital invitations and celebration management with real-time RSVP, a digital guestbook, and custom integrations.",
  },
  katalog: {
    title: "Catalog - Satu Cerita",
    description: "Explore a wide selection of the best digital invitation templates at Satu Cerita.",
  },
  caraPesan: {
    title: "How to Order - Satu Cerita",
    description: "A simple 4-step guide to creating and ordering a digital invitation at Satu Cerita.",
  },
  kontak: {
    title: "Contact - Satu Cerita",
    description:
      "Get in touch with the Satu Cerita team for consultations and help ordering digital invitations.",
  },
  kebijakan: {
    title: "Privacy Policy & Terms of Service — SatuCerita",
    description:
      "SatuCerita's privacy policy and terms of service: what data we store, how we use it, and the terms for ordering and using digital invitations.",
  },
  login: {
    title: "Log in to Satu Cerita | Digital Invitation Platform",
    description:
      "Log in to create and manage digital invitations for weddings, birthdays, and special events.",
  },
  signup: {
    title: "Create a Satu Cerita Account | Start Creating Invitations",
    description: "Sign up for free to choose your favorite digital invitation theme at Satu Cerita.",
  },
};

const titleCase = (slug: string) =>
  slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/** Metadata route sesuai bahasa. `route === null` berarti 404. */
export function localizeRouteMeta(route: RouteMeta | null, lang: Language): Meta {
  if (lang === "id") {
    return route
      ? { title: route.title, description: route.description }
      : { title: NOT_FOUND_META.title, description: NOT_FOUND_META.description };
  }
  if (!route) {
    return {
      title: "Page Not Found | Satu Cerita",
      description: "The page you're looking for could not be found at Satu Cerita.",
    };
  }
  if (EN_BY_ID[route.id]) return EN_BY_ID[route.id];

  if (route.id === "katalogDetail") {
    const name = titleCase(route.path.replace(/^\/katalog\//, ""));
    return {
      title: `${name} Invitation Template — Satu Cerita`,
      description: `See the details, features, and live preview of the ${name} digital wedding invitation template at Satu Cerita.`,
    };
  }
  return { title: route.title, description: route.description };
}
