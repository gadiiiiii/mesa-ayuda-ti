import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2Icon, ChevronLeftIcon } from "lucide-react";
import { obtenerTicket } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { NOMBRE_CATEGORIA, NOMBRE_TIPO } from "@/lib/dominio";
import { formatearConDia, formatearFechaHora } from "@/lib/formato";
import { TEXTO_HORARIO } from "@/lib/horario";
import { EstadoTicket, EtiquetaInventario, Folio, Plazo, PrioridadTicket } from "@/app/_componentes/Insignias";
import { texto, type Parametros } from "@/app/_componentes/parametros";
import AccionesEstado from "./AccionesEstado";
import Asignacion from "./Asignacion";
import Comentar from "./Comentar";
import Historial from "./Historial";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Parametros> };

async function cargar(idTexto: string) {
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id <= 0) return null;
  return obtenerTicket(await obtenerBD(), id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await cargar((await params).id);
  return { title: d ? `#${d.ticket.id} ${d.ticket.titulo}` : "Ticket no encontrado" };
}

export default async function PaginaTicket({ params, searchParams }: Props) {
  const d = await cargar((await params).id);
  if (!d) notFound();
  const { ticket: t, equipo, eventos } = d;
  const creado = texto(await searchParams, "creado") === "1";
  const ahora = new Date();

  return (
    <>
      <Link href="/tickets" className="-my-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ChevronLeftIcon className="size-4" aria-hidden="true" /> Tickets
      </Link>

      {creado && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-md border border-success/40 bg-success-soft px-3 py-2 font-semibold text-success"
        >
          <CheckCircle2Icon className="size-4" aria-hidden="true" /> Ticket #{t.id} creado. Ya aparece en la lista de pendientes.
        </p>
      )}

      <div className="mt-3">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {t.titulo} <Folio id={t.id} />
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <EstadoTicket estado={t.estado} />
          <PrioridadTicket prioridad={t.prioridad} />
          <div className="min-w-48 flex-1 sm:max-w-64">
            <Plazo ticket={t} ahora={ahora} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="titulo-detalle" className="rounded-lg border border-border bg-card p-5">
            <h2 id="titulo-detalle" className="sr-only">
              Detalle
            </h2>
            <p className="text-sm text-muted-foreground">
              {t.solicitante}, {t.unidad}. {formatearFechaHora(t.creadoEn, ahora)}.
            </p>
            <p className="mt-2 max-w-[70ch] whitespace-pre-line">{t.descripcion}</p>
          </section>

          <section aria-labelledby="titulo-historial">
            <h2 id="titulo-historial" className="text-lg font-bold">
              Historial
            </h2>
            <Historial eventos={eventos} ahora={ahora} solicitante={t.solicitante} origen={t.origen} />
            <Comentar id={t.id} />
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section aria-labelledby="titulo-acciones" className="rounded-lg border border-border bg-card p-5">
            <h2 id="titulo-acciones" className="text-lg font-bold">
              Estado
            </h2>
            <AccionesEstado id={t.id} estado={t.estado} />
          </section>

          <section aria-labelledby="titulo-asignacion" className="rounded-lg border border-border bg-card p-5">
            <h2 id="titulo-asignacion" className="text-lg font-bold">
              Asignación
            </h2>
            <Asignacion id={t.id} tecnico={t.tecnico} prioridad={t.prioridad} />
          </section>

          <section aria-labelledby="titulo-datos" className="rounded-lg border border-border bg-card p-5">
            <h2 id="titulo-datos" className="text-lg font-bold">
              Datos
            </h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Llegó por</dt>
              <dd>{t.origen === "portal" ? "Portal de solicitudes" : "Mesa de ayuda"}</dd>
              {t.codigo && (
                <>
                  <dt className="text-muted-foreground">Seguimiento</dt>
                  <dd>
                    <span className="font-mono">{t.codigo}</span>{" "}
                    <Link href={`/portal/seguimiento/${t.codigo}`} className="text-primary hover:underline">
                      Ver como el solicitante
                    </Link>
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground">Categoría</dt>
              <dd>{NOMBRE_CATEGORIA[t.categoria]}</dd>
              <dt className="text-muted-foreground">Creado</dt>
              <dd>{formatearFechaHora(t.creadoEn, ahora)}</dd>
              <dt className="text-muted-foreground">{t.pausadoDesde ? "En pausa" : "Vence"}</dt>
              <dd>{t.pausadoDesde ? `desde ${formatearFechaHora(t.pausadoDesde, ahora)}` : formatearConDia(t.venceEn)}</dd>
              {t.resueltoEn && (
                <>
                  <dt className="text-muted-foreground">Resuelto</dt>
                  <dd>{formatearFechaHora(t.resueltoEn, ahora)}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Equipo</dt>
              <dd>
                {equipo ? (
                  <Link href={`/inventario/${equipo.id}`} className="group inline-flex flex-col gap-1 hover:underline">
                    <EtiquetaInventario codigo={equipo.codigo} className="self-start" />
                    <span className="text-primary">
                      {NOMBRE_TIPO[equipo.tipo]} {equipo.marca} {equipo.modelo}
                    </span>
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Ninguno</span>
                )}
              </dd>
            </dl>
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
              El plazo corre {TEXTO_HORARIO}, y se detiene mientras el ticket está en espera.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
