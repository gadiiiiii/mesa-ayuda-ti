import type { Metadata } from "next";
import { obtenerTicket } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { texto, type Parametros } from "@/app/_componentes/parametros";
import FormularioArticulo from "../FormularioArticulo";

export const metadata: Metadata = { title: "Nuevo artículo" };

/** Con ?ticket=ID, parte del problema y la solución de ese ticket. */
export default async function NuevoArticulo({ searchParams }: { searchParams: Promise<Parametros> }) {
  const id = Number(texto(await searchParams, "ticket"));
  const d = Number.isInteger(id) && id > 0 ? await obtenerTicket(await obtenerBD(), id) : null;
  const solucion = d?.eventos.findLast((e) => e.tipo === "estado" && e.hacia === "resuelto")?.texto;
  const inicial: Record<string, string> = d
    ? {
        titulo: d.ticket.titulo,
        categoria: d.ticket.categoria,
        contenido: `${d.ticket.descripcion}\n\n${solucion ?? ""}`.trim(),
        publico: "on",
      }
    : { publico: "on" };
  return (
    <div className="mx-auto max-w-[48rem]">
      <h1 className="text-3xl font-bold">Nuevo artículo</h1>
      <p className="mt-1 text-muted-foreground">
        {d
          ? `A partir del ticket #${d.ticket.id}: revisa el texto para que sirva a cualquiera con el mismo problema.`
          : "Una solución que valga la pena no volver a investigar."}
      </p>
      <FormularioArticulo ticketId={d?.ticket.id} inicial={inicial} />
    </div>
  );
}
