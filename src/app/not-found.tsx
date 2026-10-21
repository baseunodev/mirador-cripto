import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">No encontramos esta página</h1>
      <p className="mt-2 text-muted">Puede que la moneda haya cambiado de nombre o que el link esté mal.</p>
      <p className="mt-4">
        <Link href="/" className="text-brand hover:underline">
          Ir al mercado
        </Link>
      </p>
    </div>
  );
}
