import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Links to /code exist outside the site. The code is on GitHub, so the address leads there.
  // Not permanent: a browser keeps a permanent redirect for good, and a later change to this
  // line would not reach it.
  redirects: async () => [
    { source: "/code", destination: "https://github.com/matta-kelly", permanent: false },
  ],
};

export default nextConfig;
