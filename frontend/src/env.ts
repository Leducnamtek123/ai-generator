import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// FIXME: Configure environment variables for your project (site URL, API URL, analytics ID)
export const env = createEnv({
  server: {
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.url(),
    NEXT_PUBLIC_API_URL: z.url(),
    NEXT_PUBLIC_GITHUB_URL: z.url(),
    NEXT_PUBLIC_GA_ID: z.string().optional()
  },
  runtimeEnv: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GITHUB_URL: process.env.NEXT_PUBLIC_GITHUB_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID
  }
});
