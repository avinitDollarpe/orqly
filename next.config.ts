import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the ngrok tunnel to reach the dev server (HMR + pages);
  // wildcard survives free-plan URL rotation on ngrok restarts
  allowedDevOrigins: ["*.ngrok-free.dev"],
};

export default nextConfig;
