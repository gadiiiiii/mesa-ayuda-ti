import type { Evento } from "@/lib/db/esquema";
import type { Estado } from "@/lib/dominio";
import { formatearFechaHora } from "@/lib/formato";
import TextoConEnlaces from "@/app/_componentes/TextoConEnlaces";

/** El historial contado a quien pidió ayuda: solo lo público, en segunda persona. */
function describir(e: Evento, solicitante: string): { texto: string; etiqueta?: string; destacado?: boolean } {
  const tuyo = e.autor === solicitante;
  switch (e.tipo) {
    case "creado":
      return { texto: tuyo ? "Enviaste la solicitud" : `${e.autor} registró tu solicitud` };
    case "asignacion":
      return { texto: e.hacia ? `${e.hacia} quedó a cargo` : "Quedó sin técnico asignado" };
    case "comentario":
      return { texto: tuyo ? "Escribiste" : `${e.autor} te respondió` };
    case "estado": {
      const hacia = e.hacia as Estado;
      if (hacia === "en_curso") return { texto: `${e.autor} empezó a trabajar en ella` };
      if (hacia === "en_espera") return { texto: "Quedó en espera", etiqueta: "Qué se espera" };
      if (hacia === "resuelto") return { texto: `${e.autor} la resolvió`, etiqueta: "Solución", destacado: true };
      if (hacia === "cerrado") return { texto: "Se cerró", etiqueta: e.texto ? "Motivo" : undefined };
      if (hacia === "abierto") return { texto: tuyo ? "La reabriste" : "Se reabrió", etiqueta: e.texto ? "Motivo" : undefined };
      return { texto: "Cambió de estado" };
    }
    default:
      return { texto: "" };
  }
}

export default function HistorialPortal({ eventos, solicitante, ahora }: { eventos: Evento[]; solicitante: string; ahora: Date }) {
  return (
    <ol className="mt-3 flex flex-col gap-4 border-l-2 border-border pl-4">
      {eventos.map((e) => {
        const d = describir(e, solicitante);
        return (
          <li key={e.id}>
            <p className="text-sm">
              <span className="font-semibold">{d.texto}</span>{" "}
              <time dateTime={e.creadoEn.toISOString()} className="text-muted-foreground">
                {formatearFechaHora(e.creadoEn, ahora)}
              </time>
            </p>
            {e.texto && (
              <div
                className={`mt-1.5 max-w-[70ch] rounded-md border px-3 py-2 ${d.destacado ? "border-success/40 bg-success-soft" : "border-border bg-card"}`}
              >
                {d.etiqueta && <p className="text-sm font-semibold">{d.etiqueta}</p>}
                <p className="whitespace-pre-line">
                  <TextoConEnlaces texto={e.texto} />
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
