import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a minimal standalone server bundle (.next/standalone) so the Docker
  // runner image can ship without node_modules. See infra/ + Dockerfile.
  output: "standalone",
};

export default nextConfig;
