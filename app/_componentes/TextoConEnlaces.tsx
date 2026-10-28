import Link from "next/link";

const PATRON = /(\/portal\/ayuda\/\d+)/g;

/** Convierte en enlace las rutas a artículos de ayuda («/portal/ayuda/3») que aparecen en un texto. */
export default function TextoConEnlaces({ texto }: { texto: string }) {
  const partes = texto.split(PATRON);
  return (
    <>
      {partes.map((p, i) =>
        i % 2 ? (
          <Link key={i} href={p} className="font-semibold text-primary underline-offset-2 hover:underline">
            Ver el artículo de ayuda
          </Link>
        ) : (
          p
        ),
      )}
    </>
  );
}
