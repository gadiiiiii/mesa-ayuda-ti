import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2Icon, ChevronLeftIcon, PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obtenerEquipo } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { NOMBRE_TIPO, estaPendiente } from "@/lib/dominio";
import { formatearFecha } from "@/lib/formato";
import { EstadoEquipoTexto, EtiquetaInventario } from "../../_componentes/Insignias";
import TablaTickets from "../../_componentes/TablaTickets";
import { texto, type Parametros } from "../../_componentes/parametros";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Parametros> };

async function cargar(idTexto: string) {
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id <= 0) return null;
  return obtenerEquipo(await obtenerBD(), id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await cargar((await params).id);
  return { title: d ? `${d.equipo.codigo} ${d.equipo.marca} ${d.equipo.modelo}` : "Equipo no encontrado" };
}

export default async function PaginaEquipo({ params, searchParams }: Props) {
  const d = await cargar((await params).id);
  if (!d) notFound();
  const { equipo: e, tickets } = d;
  const sp = await searchParams;
  const aviso =
    texto(sp, "creado") === "1"
      ? `Equipo agregado con el código ${e.codigo}.`
      : texto(sp, "guardado") === "1"
        ? "Cambios guardados."
        : null;
  const pendientes = tickets.filter((t) => estaPendiente(t.estado)).length;
  const ahora = new Date();

  const fila = (etiqueta: string, valor: React.ReactNode, mono = false) => (
    <>
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className={mono ? "font-mono" : undefined}>{valor ?? <span className="font-sans text-muted-foreground">Sin dato</span>}</dd>
    </>
  );

  return (
    <>
      <Link href="/inventario" className="-my-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ChevronLeftIcon className="size-4" aria-hidden="true" /> Inventario
      </Link>

      {aviso && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-md border border-success/40 bg-success-soft px-3 py-2 font-semibold text-success"
        >
          <CheckCircle2Icon className="size-4" aria-hidden="true" /> {aviso}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <EtiquetaInventario codigo={e.codigo} className="text-base" />
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            {e.marca} {e.modelo}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {NOMBRE_TIPO[e.tipo]} en {e.unidad}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/inventario/${e.id}/editar`}>
              <PencilIcon /> Editar
            </Link>
          </Button>
          {e.estado !== "de_baja" && (
            <Button asChild>
              <Link href={`/tickets/nuevo?equipo=${e.id}`}>
                <PlusIcon /> Crear ticket para este equipo
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section aria-labelledby="titulo-ficha" className="rounded-lg border border-border bg-card p-5">
          <h2 id="titulo-ficha" className="text-lg font-bold">
            Ficha
          </h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm [&_dd]:break-words [&_dd]:min-w-0">
            {fila("Estado", <EstadoEquipoTexto estado={e.estado} />)}
            {fila("Responsable", e.responsable)}
            {fila("Serie", e.serie, true)}
            {fila("IP", e.ip, true)}
            {fila("MAC", e.mac, true)}
            {fila("Compra", e.fechaCompra ? formatearFecha(e.fechaCompra) : null)}
          </dl>
          {e.notas && <p className="mt-4 border-t border-border pt-3 text-sm whitespace-pre-line">{e.notas}</p>}
        </section>

        <section aria-labelledby="titulo-tickets-equipo">
          <h2 id="titulo-tickets-equipo" className="text-lg font-bold">
            Tickets de este equipo
          </h2>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">
            {tickets.length === 0
              ? "Este equipo no ha tenido tickets."
              : `${tickets.length} en total, ${pendientes === 1 ? "1 pendiente" : `${pendientes} pendientes`}.`}
          </p>
          {tickets.length > 0 && <TablaTickets filas={tickets} ahora={ahora} sinEquipo />}
        </section>
      </div>
    </>
  );
}
