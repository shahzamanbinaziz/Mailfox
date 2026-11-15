import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  // Self-contained server bundle for small Docker images on the VPS.
  output: "standalone",
  outputFileTracingRoot: join(import.meta.dirname, "..", ".."),
  transpilePackages: ["@mailfox/ui"],
  // Native/heavy server deps stay as node_modules instead of being bundled.
  serverExternalPackages: ["mjml", "pg", "@prisma/adapter-pg", "@prisma/client"],
  experimental: {
    serverActions: {
      // Server Actions reject requests whose Origin differs from the forwarded host. GitHub Codespaces
      // proxies port 3000 through *.app.github.dev while forwarding host=localhost:3000, so allow it.
      // Production domains are added via SERVER_ACTIONS_ALLOWED_ORIGINS (comma-separated, read at build).
      allowedOrigins: [
        "localhost:3000",
        "*.app.github.dev",
        ...(process.env.SERVER_ACTIONS_ALLOWED_ORIGINS?.split(",")
          .map((s) => s.trim())
          .filter(Boolean) ?? []),
      ],
    },
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
