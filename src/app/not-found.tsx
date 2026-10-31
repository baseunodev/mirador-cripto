import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="font-display text-7xl font-bold text-gradient">404</p>
      <h1 className="mt-4 text-2xl font-bold">No encontramos esta página</h1>
      <p className="mt-2 text-muted">Puede que la moneda haya cambiado de nombre o que el link esté mal. Probá buscarla con ⌘K o volvé al mercado.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className="btn-primary">
          Ir al mercado
        </Link>
        <Link href="/convertir" className="btn-ghost">
          Conversores
        </Link>
      </div>
    </div>
  );
}
