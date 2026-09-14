import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://finlonexa.com";
const NOW = new Date();

/** Marketing roots are public; app routes are excluded from crawling. */
const MARKROOT = [
  "",
  "/features",
  "/ai-crm",
  "/automation",
  "/sales",
  "/security",
  "/about",
  "/pricing",
  "/integrations",
  "/contact",
  "/beta",
  "/updates",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return MARKROOT.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: NOW,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}