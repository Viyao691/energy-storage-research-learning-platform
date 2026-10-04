import type { NextConfig } from "next";
import { MAX_PDF_UPLOAD_BYTES } from "./lib/uploadLimits";

const backend = process.env.BACKEND_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["three"],
  experimental: {
    // Local CPU indexing can outlast the default rewrite proxy timeout.
    proxyTimeout: 600_000,
    middlewareClientMaxBodySize: MAX_PDF_UPLOAD_BYTES
  },
  async rewrites() {
    if (process.env.PORTABLE_BUILD === "1") return [];
    return [{ source: "/backend-api/:path*", destination: `${backend}/:path*` }];
  }
};
export default nextConfig;
