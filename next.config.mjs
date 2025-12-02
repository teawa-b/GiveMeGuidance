/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle forwarded headers from proxy
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "x-middleware-request-headers",
            value: "x-forwarded-host",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
