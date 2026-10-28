import type { Movimiento } from "@/lib/db/esquema";
import { NOMBRE_ESTADO_EQUIPO, type EstadoEquipo } from "@/lib/dominio";
import { formatearFechaHora } from "@/lib/formato";

const valor = (campo: string, v: string | null) =>
  v === null || v === "" ? "nadie" : campo === "estado" ? NOMBRE_ESTADO_EQUIPO[v as EstadoEquipo].toLowerCase() : v;

function describir(m: Movimiento): string {
  switch (m.campo) {
    case "alta":
      return `Ingresó al inventario en ${m.hacia}`;
    case "unidad":
      return `Se trasladó de ${m.desde} a ${m.hacia}`;
    case "responsable":
      if (!m.hacia) return `Quedó sin responsable (era ${m.desde})`;
      return m.desde ? `Cambió de responsable: de ${m.desde} a ${m.hacia}` : `Quedó a cargo de ${m.hacia}`;
    case "estado":
      return `Pasó de ${valor("estado", m.desde)} a ${valor("estado", m.hacia)}`;
    case "ip":
      return m.hacia ? `IP: ${m.desde ?? "sin IP"} → ${m.hacia}` : `Se quitó la IP ${m.desde}`;
    default:
      return `Cambió ${m.campo}`;
  }
}

/** Qué le ha pasado al equipo: alta, traslados, cambios de responsable, de estado y de IP. */
export default function HistorialEquipo({ movimientos, ahora }: { movimientos: Movimiento[]; ahora: Date }) {
  if (!movimientos.length) return null;
  return (
    <div className="mt-5 border-t border-border pt-4">
      <h3 className="font-bold">Historial</h3>
      <ol className="mt-2 flex flex-col gap-2.5 text-sm">
        {movimientos.map((m) => (
          <li key={m.id}>
            <p>{describir(m)}</p>
            <p className="text-muted-foreground">
              {formatearFechaHora(m.creadoEn, ahora)}, {m.autor}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
