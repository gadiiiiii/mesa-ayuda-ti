import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main id="contenido" className="mx-auto max-w-[44rem] px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">No existe esa página</h1>
      <p className="mt-2 text-muted-foreground">Puede que el ticket o el equipo se haya borrado al restablecer los datos de ejemplo.</p>
      <p className="mt-4 flex justify-center gap-6 font-semibold">
        <Link href="/tickets" className="text-primary hover:underline">
          Ver tickets
        </Link>
        <Link href="/inventario" className="text-primary hover:underline">
          Ver inventario
        </Link>
        <Link href="/portal" className="text-primary hover:underline">
          Pedir ayuda
        </Link>
      </p>
    </main>
  );
}
