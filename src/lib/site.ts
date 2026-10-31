// Configuración central del sitio. Cambiar marca o dominio acá y se propaga a todo.
export const site = {
  name: "Mirador Cripto",
  tagline: "El mercado cripto, explicado sin humo",
  description:
    "Precios de criptomonedas en vivo, dólar cripto por país, conversores y el índice de miedo y codicia, en español. Solo consulta: acá no se compra ni se vende nada.",
  // En Vercel se usa el dominio de producción automáticamente si no se cargó NEXT_PUBLIC_SITE_URL.
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
  ).replace(/\/$/, ""),
  locale: "es",
  numberLocale: "es-AR",
  social: {
    x: "https://x.com/miradorcripto",
    instagram: "https://instagram.com/miradorcripto",
    telegram: "https://t.me/miradorcripto",
  },
  contactEmail: "hola@miradorcripto.com",
};

// El diario hermano: las noticias viven ahí y el mirador lo enlaza.
export const diario = {
  name: "El Bloque",
  url: (process.env.NEXT_PUBLIC_DIARIO_URL || "https://el-bloque-theta.vercel.app").replace(/\/$/, ""),
};

/** Link al diario con UTM, para medir cuántas visitas le manda el mirador. */
export const diarioLink = (path = "/", campaign = "nav") =>
  `${diario.url}${path}${path.includes("?") ? "&" : "?"}utm_source=mirador&utm_medium=referral&utm_campaign=${campaign}`;

export const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT; // ca-pub-XXXXXXXXXXXXXXXX
export const gaId = process.env.NEXT_PUBLIC_GA_ID; // G-XXXXXXX

export const disclaimer =
  "Contenido informativo. No constituye asesoramiento financiero ni recomendación de inversión. Los precios son de referencia y pueden diferir de los de cada plataforma.";
