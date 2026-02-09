/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Disable automatic static optimization for better server control
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:*", "127.0.0.1:*"],
    },
  },
};

module.exports = nextConfig;
