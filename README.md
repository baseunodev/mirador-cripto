# Mirador Cripto

Sitio de noticias y datos cripto en español, monetizado con Google AdSense. Solo consulta: no se compra ni se vende nada.

## Qué incluye

| Sección | Ruta | Datos |
|---|---|---|
| Dashboard (top 100) | `/` | CoinGecko, DolarApi, CriptoYa, Alternative.me |
| Ficha por moneda (top 50 pregenerado, resto bajo demanda) | `/precio/{moneda}` | CoinGecko |
| Conversores (62 pares con demanda) | `/convertir/{moneda}-a-{fiat}` | CoinGecko + CriptoYa / ExchangeRate-API |
| Dólar cripto (6 países) | `/dolar-cripto/{pais}` | CriptoYa, DolarApi, ExchangeRate-API |
| Índice de miedo y codicia | `/indice-miedo-codicia` | Alternative.me |
| Noticias y guías | `/noticias`, `/aprende` | Markdown en `content/` |
| Institucionales | `/sobre-nosotros`, `/politica-editorial`, etc. | Markdown en `content/paginas/` |
| SEO | `/sitemap.xml`, `/news-sitemap.xml`, `/feed.xml`, `/robots.txt`, `/ads.txt` | — |

## Cómo publicar una nota

1. Crear `content/noticias/mi-nota.md` (o `content/aprende/...`) con este encabezado:

   ```
   ---
   title: Bitcoin cae 8% en un día: qué lo explica
   description: Una frase con el dato clave.
   date: 2026-10-21T10:30:00-03:00
   author: redaccion
   coins: bitcoin, ethereum
   ---
   ```
2. Escribir el cuerpo en Markdown.
3. Hacer commit y push: Vercel despliega solo.

`coins` usa los ids de CoinGecko y hace que la nota aparezca en la ficha de cada moneda. Los archivos que empiezan con `_` no se publican (sirven de borrador).

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar valores
npm run dev                  # http://localhost:3000
MOCK_DATA=1 npm run build    # build sin internet, con datos falsos
```

## Presupuesto de llamadas a CoinGecko (plan Demo, ~10.000/mes)

Todas las llamadas son del servidor y se cachean con ISR: mercados cada 15 min, datos globales cada 1 h, gráficos cada 12 h por moneda. Con tráfico normal queda por debajo del límite. Si crece, subir los tiempos en `src/lib/data.ts` (`REVALIDATE`) o pasar a un plan pago.

## Deploy en Vercel

1. Importar el repo en Vercel (framework: Next.js, sin configuración extra).
2. Cargar las variables de `.env.example` (sin `MOCK_DATA`).
3. Conectar el dominio y enviar `/sitemap.xml` y `/news-sitemap.xml` a Google Search Console.

Nota: el plan Hobby de Vercel no permite uso comercial; un sitio con anuncios necesita el plan Pro.
