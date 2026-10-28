import Link from "next/link";
import type { FilaTicket } from "@/lib/datos";
import { NOMBRE_CATEGORIA } from "@/lib/dominio";
import { formatearFechaHora } from "@/lib/formato";
import { EstadoTicket, EtiquetaInventario, Folio, Plazo, PrioridadTicket } from "./Insignias";

/**
 * Lista de tickets. En escritorio es una tabla; en el celular, cada fila se apila como tarjeta.
 * El título es el enlace (toda la fila se puede tocar gracias al ::after).
 */
export default function TablaTickets({ filas, ahora, sinEquipo = false }: { filas: FilaTicket[]; ahora: Date; sinEquipo?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full border-collapse text-left">
        <thead className="hidden border-b border-border text-sm text-muted-foreground md:table-header-group">
          <tr>
            <th scope="col" className="py-2.5 pr-3 pl-4 font-semibold">
              Ticket
            </th>
            <th scope="col" className="px-3 py-2.5 font-semibold">
              Estado
            </th>
            <th scope="col" className="px-3 py-2.5 font-semibold">
              Prioridad
            </th>
            <th scope="col" className="px-3 py-2.5 font-semibold">
              Técnico
            </th>
            <th scope="col" className="py-2.5 pr-4 pl-3 font-semibold">
              Plazo
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((t) => (
            <tr
              key={t.id}
              className="relative grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-b border-border px-4 py-3 last:border-b-0 hover:bg-primary-soft/40 md:table-row md:p-0"
            >
              <td className="col-span-2 md:py-3 md:pr-3 md:pl-4 md:align-top">
                <Link
                  href={`/tickets/${t.id}`}
                  className="font-semibold outline-none after:absolute after:inset-0 hover:underline focus-visible:after:ring-[3px] focus-visible:after:ring-primary/40 focus-visible:after:ring-inset"
                >
                  {t.titulo} <Folio id={t.id} />
                </Link>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    {t.solicitante}, {t.unidad}
                  </span>
                  <span>{NOMBRE_CATEGORIA[t.categoria]}</span>
                  {!sinEquipo && t.equipoCodigo && <EtiquetaInventario codigo={t.equipoCodigo} className="text-xs" />}
                  <span>{formatearFechaHora(t.creadoEn, ahora)}</span>
                </p>
              </td>
              <td className="text-sm md:px-3 md:py-3 md:align-top md:text-base">
                <EstadoTicket estado={t.estado} />
              </td>
              <td className="text-right text-sm md:px-3 md:py-3 md:text-left md:align-top md:text-base">
                <PrioridadTicket prioridad={t.prioridad} />
              </td>
              <td className="text-sm md:px-3 md:py-3 md:align-top md:text-base">
                {t.tecnico ?? <span className="text-muted-foreground">Sin asignar</span>}
              </td>
              <td className="flex justify-end md:table-cell md:py-3 md:pr-4 md:pl-3 md:align-top">
                <Plazo ticket={t} ahora={ahora} compacto />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
