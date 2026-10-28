import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obtenerBD } from "@/lib/db";
import { formatearFechaHora } from "@/lib/formato";
import { listarProblemas } from "@/lib/relacionados";

export const metadata: Metadata = { title: "Problemas" };

export default async function Problemas() {
  const lista = await listarProblemas(await obtenerBD());
  const ahora = new Date();
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Problemas</h1>
          <p className="mt-1 max-w-[65ch] text-muted-foreground">
            La causa común de varios tickets, como «se cae el switch de Obras». Se investiga una vez y, al resolverlo, se resuelven sus
            tickets pendientes.
          </p>
        </div>
        <Button asChild>
          <Link href="/problemas/nuevo">
            <PlusIcon /> Nuevo problema
          </Link>
        </Button>
      </div>
      {lista.length ? (
        <ul className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
          {lista.map((p) => (
            <li key={p.id} className="relative border-b border-border px-4 py-3 last:border-b-0 hover:bg-primary-soft/40">
              <Link
                href={`/problemas/${p.id}`}
                className="font-semibold outline-none after:absolute after:inset-0 hover:underline focus-visible:after:ring-[3px] focus-visible:after:ring-primary/40 focus-visible:after:ring-inset"
              >
                {p.titulo} <span className="font-mono font-normal text-muted-foreground">#{p.id}</span>
              </Link>
              <p className="mt-0.5 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                <span className={p.estado === "abierto" ? "font-semibold text-foreground" : "text-success"}>
                  {p.estado === "abierto" ? "Abierto" : "Resuelto"}
                </span>
                <span>
                  {p.total === 1 ? "1 ticket" : `${p.total} tickets`}
                  {p.pendientes > 0 && `, ${p.pendientes} pendientes`}
                </span>
                <span>
                  Creado por {p.autor}, {formatearFechaHora(p.creadoEn, ahora)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-border bg-card p-8 text-center">
          No hay problemas registrados. Puedes crear uno desde la ficha de cualquier ticket.
        </p>
      )}
    </>
  );
}
