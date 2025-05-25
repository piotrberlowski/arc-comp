import type { NextConfig } from "next";
const { version } = require('./package.json')

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: true,
  publicRuntimeConfig: {
    version,
  },
};

export default nextConfig;
