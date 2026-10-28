import type { Metadata } from "next";
import { obtenerTicket } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { texto, type Parametros } from "@/app/_componentes/parametros";
import FormularioProblema from "./FormularioProblema";

export const metadata: Metadata = { title: "Nuevo problema" };

export default async function NuevoProblema({ searchParams }: { searchParams: Promise<Parametros> }) {
  const id = Number(texto(await searchParams, "ticket"));
  const d = Number.isInteger(id) && id > 0 ? await obtenerTicket(await obtenerBD(), id) : null;
  return (
    <div className="mx-auto max-w-[44rem]">
      <h1 className="text-3xl font-bold">Nuevo problema</h1>
      <p className="mt-1 text-muted-foreground">
        {d ? `Se crea con el ticket #${d.ticket.id} vinculado. Después puedes agregar otros.` : "Después puedes vincularle tickets."}
      </p>
      <FormularioProblema ticketId={d?.ticket.id} />
    </div>
  );
}
