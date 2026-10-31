# Mirador Cripto

Herramienta de datos cripto en español, hermana del diario [El Bloque](https://el-bloque-theta.vercel.app). Solo consulta: no se compra ni se vende nada. Las noticias y guías se publican en El Bloque; el mirador muestra sus titulares y enlaza.

## Qué incluye

| Sección | Ruta | Datos |
|---|---|---|
| Mercado (top 100, mapa de calor, favoritas) | `/` | CoinGecko, Binance (vivo), DolarApi, CriptoYa, Alternative.me |
| Ficha por moneda | `/precio/{moneda}` | CoinGecko + titulares de El Bloque |
| Conversores | `/convertir` y `/convertir/{moneda}-a-{fiat}` | CoinGecko + CriptoYa / ExchangeRate-API |
| Dólar cripto (6 países) | `/dolar-cripto/{pais}` | CriptoYa, DolarApi, ExchangeRate-API |
| Índice de miedo y codicia | `/indice-miedo-codicia` | Alternative.me |
| Institucionales | `/sobre-nosotros`, `/politica-editorial`, etc. | Markdown en `content/paginas/` |
| SEO | `/sitemap.xml`, `/robots.txt`, `/ads.txt` | — |

Extras: buscador global (⌘K o `/`), monedas favoritas guardadas en el navegador, barra inferior en celulares, aviso cuando los precios en vivo no llegan o los datos quedaron viejos.

Las rutas viejas `/noticias` y `/aprende` redirigen (301) a El Bloque para no duplicar contenido en Google.

## Calidad

- `npm test`: pruebas de formatos, buscador, lector del RSS y catálogo.
- `npm run lint` y `npm run typecheck`.
- GitHub Actions corre todo lo anterior y un build en cada PR (`.github/workflows/ci.yml`).
- Control diario de las APIs (`.github/workflows/apis.yml`, script `scripts/check-apis.mjs`): si una API cambia o se cae, falla y GitHub avisa por mail.

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
