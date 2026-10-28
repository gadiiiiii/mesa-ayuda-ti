import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { buscarArticulos } from "@/lib/conocimiento";
import { obtenerBD } from "@/lib/db";
import { NOMBRE_CATEGORIA } from "@/lib/dominio";
import { texto, type Parametros } from "@/app/_componentes/parametros";

export const metadata: Metadata = { title: "Ayuda" };

export default async function Ayuda({ searchParams }: { searchParams: Promise<Parametros> }) {
  const q = texto(await searchParams, "q");
  const lista = await buscarArticulos(await obtenerBD(), { q, soloPublicos: true });
  return (
    <div className="mx-auto max-w-[44rem]">
      <h1 className="text-3xl font-bold">Ayuda</h1>
      <p className="mt-1 text-muted-foreground">Soluciones a los problemas más comunes. Si no encuentras la tuya, pide ayuda.</p>
      <form action="/portal/ayuda" role="search" className="mt-6 flex gap-2">
        <label htmlFor="buscar-ayuda" className="sr-only">
          Buscar en la ayuda
        </label>
        <div className="relative flex-1">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="buscar-ayuda"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Por ejemplo: impresora, contraseña, wifi"
            className="h-11 w-full rounded-md border border-border bg-card pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground/70 hover:border-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/25"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-primary/50"
        >
          Buscar
        </button>
      </form>
      {lista.length ? (
        <ul className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
          {lista.map((a) => (
            <li key={a.id} className="relative border-b border-border px-4 py-3 last:border-b-0 hover:bg-primary-soft/40">
              <Link
                href={`/portal/ayuda/${a.id}`}
                className="font-semibold outline-none after:absolute after:inset-0 hover:underline focus-visible:after:ring-[3px] focus-visible:after:ring-primary/40 focus-visible:after:ring-inset"
              >
                {a.titulo}
              </Link>
              <p className="mt-0.5 text-sm text-muted-foreground">{NOMBRE_CATEGORIA[a.categoria]}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-border bg-card p-6 text-center">
          No encontramos artículos sobre eso.{" "}
          <Link href="/portal" className="font-semibold text-primary hover:underline">
            Pide ayuda a Informática
          </Link>
        </p>
      )}
    </div>
  );
}
