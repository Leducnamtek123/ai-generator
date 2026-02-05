import type { MetadataRoute } from "next";

import { env } from "@/env";

const baseUrl = env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    // Homepage
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },

    // Creator Tools - High Priority SEO Pages
    {
      url: `${baseUrl}/creator/image-generator`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/creator/video-generator`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/creator/music-generator`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/creator/workflow-editor`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/creator/ai-assistant`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // Dashboard Pages
    {
      url: `${baseUrl}/dashboard`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/creative-studio`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/community`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.6,
    },

    // Auth Pages
    {
      url: `${baseUrl}/sign-in`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
