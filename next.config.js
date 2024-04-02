/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_OUTPUT ?? "standalone",
};

module.exports = nextConfig;
