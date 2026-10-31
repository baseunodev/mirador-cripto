import type { NextConfig } from "next";

// Las noticias y guías ahora viven solo en el diario (evita contenido duplicado en Google).
// Redirecciones permanentes para no perder links viejos ni posicionamiento.
const diario = (process.env.NEXT_PUBLIC_DIARIO_URL || "https://el-bloque-theta.vercel.app").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/aprende/como-detectar-estafas-cripto", destination: `${diario}/seguridad/como-detectar-estafas-cripto`, permanent: true },
      { source: "/aprende/:slug", destination: `${diario}/guias/:slug`, permanent: true },
      { source: "/aprende", destination: `${diario}/guias`, permanent: true },
      { source: "/noticias/:path*", destination: `${diario}/mercado`, permanent: true },
      { source: "/feed.xml", destination: `${diario}/feed.xml`, permanent: true },
      { source: "/news-sitemap.xml", destination: `${diario}/news-sitemap.xml`, permanent: true },
    ];
  },
};

export default nextConfig;
