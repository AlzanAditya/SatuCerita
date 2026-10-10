import { useEffect } from "react";
import { SITE } from "@/config/site";

export interface SeoProps {
  title: string;
  description: string;
  /** Path halaman, mis. "/katalog". Dipakai untuk canonical & og:url. */
  path: string;
  /** Path/URL gambar OG. Default: logo Satu Cerita. */
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  /** true => `noindex, nofollow` */
  noindex?: boolean;
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const absolute = (urlOrPath: string) =>
  /^https?:\/\//.test(urlOrPath)
    ? encodeURI(urlOrPath)
    : encodeURI(`${SITE.url}${urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`}`);

/**
 * Sinkronkan <title> & meta SEO di sisi client saat navigasi SPA.
 * Nilai awalnya (untuk crawler) sudah ditulis oleh `scripts/generate-ssg.ts`,
 * jadi keduanya SELALU dibaca dari `src/routes.ts` agar konsisten.
 */
export function useSeo({
  title,
  description,
  path,
  image = SITE.ogImage.path,
  imageWidth = SITE.ogImage.width,
  imageHeight = SITE.ogImage.height,
  imageAlt = SITE.ogImage.alt,
  noindex = false,
}: SeoProps) {
  useEffect(() => {
    const url = `${SITE.url}${path}`;
    const imageUrl = absolute(image);
    const imageType = imageUrl.endsWith(".png")
      ? "image/png"
      : imageUrl.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
    const isSquare = imageWidth === imageHeight;

    document.title = title;

    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setLink("canonical", url);
    setLink("image_src", imageUrl);

    setMeta("property", "og:site_name", SITE.name);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", url);
    setMeta("property", "og:locale", SITE.locale);
    setMeta("property", "og:image", imageUrl);
    setMeta("property", "og:image:secure_url", imageUrl);
    setMeta("property", "og:image:type", imageType);
    setMeta("property", "og:image:width", String(imageWidth));
    setMeta("property", "og:image:height", String(imageHeight));
    setMeta("property", "og:image:alt", imageAlt);

    setMeta("name", "twitter:card", isSquare ? "summary" : "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", imageUrl);
    setMeta("name", "twitter:image:alt", imageAlt);
  }, [title, description, path, image, imageWidth, imageHeight, imageAlt, noindex]);
}
