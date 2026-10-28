import type { Metadata } from "next";
import Link from "next/link";
import { SettingsIcon } from "lucide-react";
import { misTickets } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import TablaTickets from "@/app/_componentes/TablaTickets";
import { tecnicoActual } from "@/app/sesion";

export const metadata: Metadata = { title: "Mis tickets" };

export default async function MisTickets() {
  const tecnico = await tecnicoActual();
  const ahora = new Date();
  const m = await misTickets(await obtenerBD(), tecnico, ahora);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mis tickets</h1>
          <p className="mt-1 text-muted-foreground">Lo que tiene asignado {tecnico}. Cambia de técnico arriba, en «Actúas como».</p>
        </div>
        <Link href="/asignacion" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <SettingsIcon className="size-4" aria-hidden="true" /> Asignación automática
        </Link>
      </div>

      <section aria-labelledby="titulo-asignados" className="mt-8">
        <h2 id="titulo-asignados" className="text-lg font-bold">
          Asignados a ti <span className="font-normal text-muted-foreground">({m.asignados.length})</span>
        </h2>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">Primero los que vencen antes.</p>
        {m.asignados.length ? (
          <TablaTickets filas={m.asignados} ahora={ahora} />
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center">No tienes tickets pendientes.</p>
        )}
      </section>

      <section aria-labelledby="titulo-por-tomar" className="mt-10">
        <h2 id="titulo-por-tomar" className="text-lg font-bold">
          Para tomar
        </h2>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Pendientes sin técnico, los más urgentes primero.{" "}
          <Link href="/tickets?tecnico=sin_asignar" className="font-semibold text-primary hover:underline">
            Ver todos los sin asignar
          </Link>
        </p>
        {m.porTomar.length ? (
          <TablaTickets filas={m.porTomar} ahora={ahora} />
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center">No hay tickets sin asignar.</p>
        )}
      </section>

      <section aria-labelledby="titulo-resueltos" className="mt-10">
        <h2 id="titulo-resueltos" className="text-lg font-bold">
          Resueltos por ti esta semana <span className="font-normal text-muted-foreground">({m.resueltos.length})</span>
        </h2>
        <div className="mt-3">
          {m.resueltos.length ? (
            <TablaTickets filas={m.resueltos} ahora={ahora} />
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
              Todavía no resuelves tickets en los últimos 7 días.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
