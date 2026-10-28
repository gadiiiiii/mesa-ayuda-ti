import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2Icon, ChevronLeftIcon } from "lucide-react";
import { obtenerBD } from "@/lib/db";
import { formatearFecha, formatearFechaHora } from "@/lib/formato";
import { aLocal } from "@/lib/horario";
import { agendaMantenciones, estadoMantencion } from "@/lib/inventario";
import { cn } from "@/lib/utils";
import { EtiquetaInventario } from "@/app/_componentes/Insignias";
import { Realizar } from "../[id]/Mantenciones";

export const metadata: Metadata = { title: "Mantenciones" };

export default async function Mantenciones() {
  const ahora = new Date();
  const hoy = aLocal(ahora).fecha;
  const { pendientes, realizadas } = await agendaMantenciones(await obtenerBD(), hoy, 30);
  const atrasadas = pendientes.filter((m) => estadoMantencion(m, hoy) === "vencida");
  const proximas = pendientes.filter((m) => estadoMantencion(m, hoy) !== "vencida");

  const lista = (filas: typeof pendientes, vacio: string) =>
    filas.length ? (
      <ul className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
        {filas.map((m) => {
          const atrasada = estadoMantencion(m, hoy) === "vencida";
          return (
            <li key={m.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
              <div className="min-w-0">
                <p className="font-semibold">
                  {m.tipo}{" "}
                  <Link href={`/inventario/${m.equipoId}`} className="ml-1 align-middle">
                    <EtiquetaInventario codigo={m.equipoCodigo} className="text-xs hover:border-muted-foreground" />
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  {m.equipoNombre}, {m.unidad}
                </p>
                <p className={cn("text-sm", atrasada ? "font-semibold text-destructive" : "text-muted-foreground")}>
                  {atrasada ? "Atrasada desde el" : "Para el"} {formatearFecha(m.programadaPara)}
                  {m.cadaMeses && `, cada ${m.cadaMeses === 1 ? "mes" : `${m.cadaMeses} meses`}`}
                </p>
              </div>
              <Realizar id={m.id} />
            </li>
          );
        })}
      </ul>
    ) : (
      <p className="mt-3 rounded-lg border border-dashed border-border bg-card p-5 text-center text-sm">{vacio}</p>
    );

  return (
    <>
      <Link href="/inventario" className="-my-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ChevronLeftIcon className="size-4" aria-hidden="true" /> Inventario
      </Link>
      <h1 className="mt-3 text-3xl font-bold">Mantenciones preventivas</h1>
      <p className="mt-1 max-w-[65ch] text-muted-foreground">
        Limpiezas, cambios de tóner y revisiones programadas. Las periódicas se vuelven a programar solas al registrarlas. Se programan
        desde la ficha de cada equipo.
      </p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
        <section aria-labelledby="titulo-atrasadas">
          <h2 id="titulo-atrasadas" className="text-lg font-bold">
            Atrasadas <span className="font-normal text-muted-foreground">({atrasadas.length})</span>
          </h2>
          {lista(atrasadas, "No hay mantenciones atrasadas.")}
        </section>
        <section aria-labelledby="titulo-proximas">
          <h2 id="titulo-proximas" className="text-lg font-bold">
            Próximos 30 días <span className="font-normal text-muted-foreground">({proximas.length})</span>
          </h2>
          {lista(proximas, "Nada programado para los próximos 30 días.")}
        </section>
      </div>

      {realizadas.length > 0 && (
        <section aria-labelledby="titulo-realizadas" className="mt-10">
          <h2 id="titulo-realizadas" className="text-lg font-bold">
            Realizadas recientemente
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {realizadas.map((m) => (
              <li key={m.id} className="flex gap-2">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                <span>
                  {m.tipo} de{" "}
                  <Link href={`/inventario/${m.equipoId}`} className="font-semibold text-primary hover:underline">
                    {m.equipoCodigo}
                  </Link>{" "}
                  ({m.unidad}), {formatearFechaHora(m.realizadaEn!, ahora)} por {m.realizadaPor}
                  {m.nota && <span className="block text-muted-foreground">{m.nota}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
