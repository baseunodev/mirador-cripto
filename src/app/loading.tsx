// Esqueleto mientras carga una página (se ve en navegaciones lentas, en lugar de una pantalla quieta).
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <div className="skeleton h-4 w-48" />
      <div className="skeleton mt-3 h-10 w-80 max-w-full" />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="skeleton h-80 lg:col-span-2" />
        <div className="grid gap-4">
          <div className="skeleton h-36" />
          <div className="skeleton h-40" />
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="skeleton h-56" />
        <div className="skeleton h-56" />
        <div className="skeleton h-56" />
      </div>
    </div>
  );
}
