import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { cargaPendiente, obtenerReglas, tecnicosDisponibles } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import FormularioReglas from "./FormularioReglas";

export const metadata: Metadata = { title: "Asignación automática" };

export default async function Asignacion() {
  const bd = await obtenerBD();
  const [reglas, disponibles, carga] = await Promise.all([obtenerReglas(bd), tecnicosDisponibles(bd), cargaPendiente(bd)]);
  return (
    <div className="mx-auto max-w-[44rem]">
      <Link
        href="/mis-tickets"
        className="-my-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeftIcon className="size-4" aria-hidden="true" /> Mis tickets
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Asignación automática</h1>
      <p className="mt-1 max-w-[65ch] text-muted-foreground">
        Qué pasa con cada ticket nuevo, según su categoría. Se aplica a los que registra un técnico y a los que llegan por el portal.
      </p>
      <FormularioReglas reglas={reglas} disponibles={disponibles} carga={Object.fromEntries(carga)} />
    </div>
  );
}
