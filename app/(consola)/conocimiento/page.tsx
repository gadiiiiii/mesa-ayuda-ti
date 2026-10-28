import type { Metadata } from "next";
import Link from "next/link";
import { EyeOffIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buscarArticulos } from "@/lib/conocimiento";
import { obtenerBD } from "@/lib/db";
import { CATEGORIAS, NOMBRE_CATEGORIA } from "@/lib/dominio";
import Filtros from "@/app/_componentes/Filtros";
import { opcion, texto, type Parametros } from "@/app/_componentes/parametros";

export const metadata: Metadata = { title: "Base de conocimiento" };

export default async function Conocimiento({ searchParams }: { searchParams: Promise<Parametros> }) {
  const p = await searchParams;
  const q = texto(p, "q");
  const categoria = opcion(p, "categoria", CATEGORIAS);
  const lista = await buscarArticulos(await obtenerBD(), { q, categoria });
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Base de conocimiento</h1>
          <p className="mt-1 max-w-[65ch] text-muted-foreground">
            Soluciones escritas una vez para no resolver dos veces lo mismo. Las públicas aparecen en el portal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/respuestas" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
            Respuestas predefinidas
          </Link>
          <Button asChild>
            <Link href="/conocimiento/nuevo">
              <PlusIcon /> Nuevo artículo
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-6">
        <Filtros
          accion="/conocimiento"
          q={q}
          placeholder="Por ejemplo: impresora, contraseña, wifi"
          hayFiltros={!!(q || categoria)}
          selects={[
            {
              nombre: "categoria",
              etiqueta: "Categoría",
              valor: categoria ?? "",
              opciones: [{ valor: "", texto: "Todas" }, ...CATEGORIAS.map((c) => ({ valor: c, texto: NOMBRE_CATEGORIA[c] }))],
            },
          ]}
        />
      </div>
      <p className="mt-6 mb-2 text-sm text-muted-foreground" aria-live="polite">
        {lista.length === 1 ? "1 artículo" : `${lista.length} artículos`}
        {q && ", los más relevantes primero"}
      </p>
      {lista.length ? (
        <ul className="overflow-hidden rounded-lg border border-border bg-card">
          {lista.map((a) => (
            <li key={a.id} className="relative border-b border-border px-4 py-3 last:border-b-0 hover:bg-primary-soft/40">
              <Link
                href={`/conocimiento/${a.id}`}
                className="font-semibold outline-none after:absolute after:inset-0 hover:underline focus-visible:after:ring-[3px] focus-visible:after:ring-primary/40 focus-visible:after:ring-inset"
              >
                {a.titulo}
              </Link>
              <p className="mt-0.5 line-clamp-2 max-w-[80ch] text-sm text-muted-foreground">{a.extracto}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>{NOMBRE_CATEGORIA[a.categoria]}</span>
                {a.publico ? (
                  <span>En el portal</span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <EyeOffIcon className="size-3.5" aria-hidden="true" /> Solo técnicos
                  </span>
                )}
                {a.utiles + a.noUtiles > 0 && (
                  <span>
                    Le sirvió a {a.utiles} de {a.utiles + a.noUtiles}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          Ningún artículo coincide.{" "}
          <Link href="/conocimiento/nuevo" className="font-semibold text-primary hover:underline">
            Escribir uno
          </Link>
        </p>
      )}
    </>
  );
}
