// Configuración central del sitio. Cambiar marca o dominio acá y se propaga a todo.
export const site = {
  name: "Mirador Cripto",
  tagline: "El mercado cripto, explicado sin humo",
  description:
    "Precios de criptomonedas en vivo, dólar cripto por país, conversores y noticias explicadas en español. Solo consulta: acá no se compra ni se vende nada.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "es",
  numberLocale: "es-AR",
  social: {
    x: "https://x.com/miradorcripto",
    instagram: "https://instagram.com/miradorcripto",
    telegram: "https://t.me/miradorcripto",
  },
  contactEmail: "hola@miradorcripto.com",
};

export const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT; // ca-pub-XXXXXXXXXXXXXXXX
export const gaId = process.env.NEXT_PUBLIC_GA_ID; // G-XXXXXXX

export const disclaimer =
  "Contenido informativo. No constituye asesoramiento financiero ni recomendación de inversión. Los precios son de referencia y pueden diferir de los de cada plataforma.";
