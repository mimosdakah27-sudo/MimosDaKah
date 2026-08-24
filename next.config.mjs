/** @type {import('next').NextConfig} */
const supaHost = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/^https?:\/\//, "");

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
      timeout: 30,
    },
  },
};

export default nextConfig;