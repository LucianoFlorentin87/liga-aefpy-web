import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Next.js rechaza el request ANTES de que corra nuestro código si supera
      // este límite (default 1MB) — sin pasar por los try/catch de las server
      // actions, así que se ve como un error genérico de servidor, no un
      // mensaje de validación. Lo subimos por encima del máximo real que
      // aceptamos nosotros mismos: logos hasta 2MB (src/lib/upload.ts) y el
      // PDF del reglamento hasta 15MB.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
