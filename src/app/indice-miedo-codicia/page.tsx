import type { Metadata } from "next";
import { getFearGreed } from "@/lib/data";
import { date, fngLabel } from "@/lib/format";
import { Gauge } from "@/components/visuals";
import { AdSlot, Breadcrumbs, Card, Disclaimer, Unavailable, Updated } from "@/components/ui";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [today] = await getFearGreed(1);
  return {
    title: "Índice de miedo y codicia cripto hoy",
    description: today
      ? `El índice de miedo y codicia del mercado cripto marca ${today.value} (${fngLabel(today.label).toLowerCase()}). Qué significa, historial de 30 días y cómo leerlo.`
      : "Qué es el índice de miedo y codicia del mercado cripto, cómo se calcula y su historial.",
    alternates: { canonical: "/indice-miedo-codicia" },
  };
}

const color = (v: number) => (v < 25 ? "var(--down)" : v < 45 ? "#e07b39" : v <= 55 ? "var(--muted)" : v <= 75 ? "#7cb342" : "var(--up)");

export default async function FearGreedPage() {
  const data = await getFearGreed(30);
  const today = data[0];
  const week = data[7];
  const month = data[29];

  return (
    <>
      <Breadcrumbs items={[{ name: "Índice de miedo y codicia", href: "/indice-miedo-codicia" }]} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Índice de miedo y codicia cripto hoy</h1>
      {today ? (
        <>
          <Card className="mt-5 text-center">
            <Gauge value={today.value} label={today.label} size={300} />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <p>
                Hace una semana: <strong>{week ? `${week.value} (${fngLabel(week.label)})` : "—"}</strong>
              </p>
              <p>
                Hace un mes: <strong>{month ? `${month.value} (${fngLabel(month.label)})` : "—"}</strong>
              </p>
            </div>
            <div className="mt-3">
              <Updated at={today.timestamp} source="Alternative.me" />
            </div>
          </Card>

          <Card className="mt-4">
            <h2 className="mb-3 font-bold">Últimos 30 días</h2>
            <div className="flex h-32 items-end gap-1" role="img" aria-label="Historial del índice en los últimos 30 días">
              {[...data].reverse().map((d) => (
                <div key={d.timestamp} title={`${date(d.timestamp)}: ${d.value}`} className="flex-1 rounded-t opacity-80 transition hover:opacity-100" style={{ height: `${d.value}%`, background: color(d.value) }} />
              ))}
            </div>
          </Card>
        </>
      ) : (
        <div className="mt-5">
          <Unavailable what="el índice" />
        </div>
      )}

      <AdSlot slot="fng-mid" />

      <Card className="mt-4">
        <div className="prose-mc">
          <h2>Qué es el índice de miedo y codicia</h2>
          <p>
            Es un termómetro del ánimo del mercado cripto que va de 0 a 100. Cerca de 0 indica miedo extremo: la gente vende con pánico. Cerca de 100 indica codicia extrema: la gente compra por euforia.
          </p>
          <h3>Cómo se calcula</h3>
          <p>
            Lo publica Alternative.me y combina varios datos: la volatilidad del precio de bitcoin, el volumen de operaciones, lo que se habla en redes sociales, la dominancia de bitcoin y las tendencias de búsqueda.
          </p>
          <h3>Cómo leerlo sin caer en trampas</h3>
          <ul>
            <li>Es una foto del ánimo, no una predicción. El mercado puede seguir en miedo durante meses.</li>
            <li>Sirve más para entender el contexto de una noticia que para decidir cuándo comprar o vender.</li>
            <li>Mide sobre todo a bitcoin: otras monedas pueden moverse distinto.</li>
          </ul>
        </div>
      </Card>
      <Disclaimer />
    </>
  );
}
