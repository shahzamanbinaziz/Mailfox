import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  // Self-contained server bundle for small Docker images on the VPS.
  output: "standalone",
  outputFileTracingRoot: join(import.meta.dirname, "..", ".."),
  transpilePackages: ["@mailfox/ui"],
  // Native/heavy server deps stay as node_modules instead of being bundled.
  serverExternalPackages: ["mjml", "pg", "@prisma/adapter-pg", "@prisma/client"],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
