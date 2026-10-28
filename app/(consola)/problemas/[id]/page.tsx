import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2Icon, ChevronLeftIcon } from "lucide-react";
import { obtenerBD } from "@/lib/db";
import { estaPendiente } from "@/lib/dominio";
import { formatearFechaHora } from "@/lib/formato";
import { obtenerProblema } from "@/lib/relacionados";
import TablaTickets from "@/app/_componentes/TablaTickets";
import AgregarTicket from "./AgregarTicket";
import ResolverProblema from "./ResolverProblema";

type Props = { params: Promise<{ id: string }> };

async function cargar(idTexto: string) {
  const id = Number(idTexto);
  return Number.isInteger(id) && id > 0 ? obtenerProblema(await obtenerBD(), id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await cargar((await params).id);
  return { title: d ? `Problema #${d.problema.id} ${d.problema.titulo}` : "Problema no encontrado" };
}

export default async function PaginaProblema({ params }: Props) {
  const d = await cargar((await params).id);
  if (!d) notFound();
  const { problema: p, tickets } = d;
  const pendientes = tickets.filter((t) => estaPendiente(t.estado)).length;
  const ahora = new Date();

  return (
    <>
      <Link href="/problemas" className="-my-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ChevronLeftIcon className="size-4" aria-hidden="true" /> Problemas
      </Link>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
        {p.titulo} <span className="font-mono font-normal text-muted-foreground">#{p.id}</span>
      </h1>
      <p className="mt-1 text-muted-foreground">
        {p.estado === "abierto" ? "Abierto" : `Resuelto el ${formatearFechaHora(p.resueltoEn!, ahora)}`}. Creado por {p.autor},{" "}
        {formatearFechaHora(p.creadoEn, ahora)}.
      </p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="titulo-tickets-problema" className="min-w-0">
          <h2 id="titulo-tickets-problema" className="text-lg font-bold">
            Tickets afectados <span className="font-normal text-muted-foreground">({tickets.length})</span>
          </h2>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">{pendientes === 1 ? "1 pendiente." : `${pendientes} pendientes.`}</p>
          {tickets.length ? (
            <TablaTickets filas={tickets} ahora={ahora} />
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center">Todavía no tiene tickets vinculados.</p>
          )}
          {p.estado === "abierto" && <AgregarTicket problemaId={p.id} />}
        </section>

        <aside className="flex flex-col gap-6">
          {p.descripcion && (
            <section aria-labelledby="titulo-sabe" className="rounded-lg border border-border bg-card p-5">
              <h2 id="titulo-sabe" className="text-lg font-bold">
                Qué se sabe
              </h2>
              <p className="mt-2 whitespace-pre-line">{p.descripcion}</p>
            </section>
          )}
          {p.estado === "resuelto" ? (
            <section aria-labelledby="titulo-solucion" className="rounded-lg border border-success/40 bg-success-soft p-5">
              <h2 id="titulo-solucion" className="flex items-center gap-2 text-lg font-bold text-success">
                <CheckCircle2Icon className="size-5" aria-hidden="true" /> Resuelto
              </h2>
              <p className="mt-3 text-sm font-semibold">Causa</p>
              <p className="whitespace-pre-line">{p.causa}</p>
              <p className="mt-3 text-sm font-semibold">Solución</p>
              <p className="whitespace-pre-line">{p.solucion}</p>
            </section>
          ) : (
            <section aria-labelledby="titulo-resolver" className="rounded-lg border border-border bg-card p-5">
              <h2 id="titulo-resolver" className="text-lg font-bold">
                Resolver el problema
              </h2>
              <ResolverProblema id={p.id} pendientes={pendientes} />
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
