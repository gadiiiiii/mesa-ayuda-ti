import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listarTickets, type FiltrosTickets } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { CATEGORIAS, ESTADOS, NOMBRE_CATEGORIA, NOMBRE_ESTADO, NOMBRE_PRIORIDAD, PRIORIDADES, TECNICOS } from "@/lib/dominio";
import Filtros from "@/app/_componentes/Filtros";
import TablaTickets from "@/app/_componentes/TablaTickets";
import { opcion, texto, type Parametros } from "@/app/_componentes/parametros";

export const metadata: Metadata = { title: "Tickets" };

export default async function PaginaTickets({ searchParams }: { searchParams: Promise<Parametros> }) {
  const p = await searchParams;
  const f: FiltrosTickets = {
    estado: opcion(p, "estado", ["pendientes", "todos", ...ESTADOS] as const) ?? "pendientes",
    prioridad: opcion(p, "prioridad", PRIORIDADES),
    categoria: opcion(p, "categoria", CATEGORIAS),
    tecnico: opcion(p, "tecnico", ["sin_asignar", ...TECNICOS] as const),
    q: texto(p, "q") || undefined,
  };
  const ahora = new Date();
  const filas = await listarTickets(await obtenerBD(), f);
  const hayFiltros = f.estado !== "pendientes" || !!(f.prioridad || f.categoria || f.tecnico || f.q);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="mt-1 text-muted-foreground">
            {f.estado === "pendientes" ? "Los pendientes, ordenados por el plazo que vence primero." : "Los más recientes primero."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/problemas" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
            Problemas
          </Link>
          <Button asChild>
            <Link href="/tickets/nuevo">
              <PlusIcon /> Nuevo ticket
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Filtros
          accion="/tickets"
          q={f.q ?? ""}
          placeholder="Título, persona, folio o equipo"
          hayFiltros={hayFiltros}
          selects={[
            {
              nombre: "estado",
              etiqueta: "Estado",
              valor: f.estado!,
              opciones: [
                { valor: "pendientes", texto: "Pendientes" },
                ...ESTADOS.map((e) => ({ valor: e, texto: NOMBRE_ESTADO[e] })),
                { valor: "todos", texto: "Todos" },
              ],
            },
            {
              nombre: "prioridad",
              etiqueta: "Prioridad",
              valor: f.prioridad ?? "",
              opciones: [{ valor: "", texto: "Todas" }, ...PRIORIDADES.toReversed().map((x) => ({ valor: x, texto: NOMBRE_PRIORIDAD[x] }))],
            },
            {
              nombre: "categoria",
              etiqueta: "Categoría",
              valor: f.categoria ?? "",
              opciones: [{ valor: "", texto: "Todas" }, ...CATEGORIAS.map((c) => ({ valor: c, texto: NOMBRE_CATEGORIA[c] }))],
            },
            {
              nombre: "tecnico",
              etiqueta: "Técnico",
              valor: f.tecnico ?? "",
              opciones: [
                { valor: "", texto: "Todos" },
                ...TECNICOS.map((t) => ({ valor: t, texto: t })),
                { valor: "sin_asignar", texto: "Sin asignar" },
              ],
            },
          ]}
        />
      </div>

      <p className="mt-6 mb-2 text-sm text-muted-foreground" aria-live="polite">
        {filas.length === 1 ? "1 ticket" : `${filas.length} tickets`}
        {filas.length === 200 && " (se muestran los primeros 200; usa los filtros para acotar)"}
      </p>
      {filas.length ? (
        <TablaTickets filas={filas} ahora={ahora} />
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="font-semibold">{hayFiltros ? "Ningún ticket coincide con estos filtros." : "No hay tickets pendientes."}</p>
          <p className="mt-1 text-muted-foreground">
            {hayFiltros ? (
              <Link href="/tickets" className="font-semibold text-primary hover:underline">
                Ver los pendientes
              </Link>
            ) : (
              "Cuando alguien pida ayuda, regístralo con «Nuevo ticket»."
            )}
          </p>
        </div>
      )}
    </>
  );
}
