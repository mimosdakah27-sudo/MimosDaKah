import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

const supaHost = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/^https?:\/\//, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.100.161'],
  
  images: {
    // Evita que o Node.js faça fetch interno das imagens do Supabase no servidor
    
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(supaHost ? [{ protocol: "https", hostname: supaHost }] : []),
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default function config(phase) {
  return {
    ...nextConfig,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
