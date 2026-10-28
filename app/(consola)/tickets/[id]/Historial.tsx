import { ArrowRightLeftIcon, MessageSquareIcon, PlusCircleIcon, SignalIcon, UserRoundIcon } from "lucide-react";
import type { Evento } from "@/lib/db/esquema";
import { NOMBRE_ESTADO, NOMBRE_PRIORIDAD, type Estado, type Prioridad } from "@/lib/dominio";
import { formatearFechaHora, hace } from "@/lib/formato";

interface Contexto {
  solicitante: string;
  origen: "mesa" | "portal";
}

function describir(e: Evento, c: Contexto): { texto: React.ReactNode; nota?: string; etiquetaNota?: string; interna?: boolean } {
  const quien = <strong className="font-semibold">{e.autor}</strong>;
  const delSolicitante = e.autor === c.solicitante;
  switch (e.tipo) {
    case "creado":
      return { texto: c.origen === "portal" ? <>{quien} pidió ayuda desde el portal</> : <>{quien} registró el ticket</> };
    case "comentario":
      if (!e.publico)
        return { texto: <>{quien} dejó una nota interna</>, nota: e.texto ?? "", etiquetaNota: "No la ve el solicitante", interna: true };
      return { texto: delSolicitante ? <>{quien} escribió desde el portal</> : <>{quien} respondió al solicitante</>, nota: e.texto ?? "" };
    case "asignacion":
      if (!e.hacia) return { texto: <>{quien} dejó el ticket sin asignar</> };
      if (e.hacia === e.autor) return { texto: <>{quien} se asignó el ticket</> };
      return {
        texto: (
          <>
            {quien} se lo asignó a <strong className="font-semibold">{e.hacia}</strong>
          </>
        ),
      };
    case "prioridad":
      return {
        texto: (
          <>
            {quien} cambió la prioridad de {NOMBRE_PRIORIDAD[e.desde as Prioridad]} a{" "}
            <strong className="font-semibold">{NOMBRE_PRIORIDAD[e.hacia as Prioridad]}</strong>
          </>
        ),
      };
    case "estado": {
      const desde = e.desde as Estado;
      const hacia = e.hacia as Estado;
      const nota = e.texto ?? undefined;
      if (hacia === "en_curso")
        return {
          texto: (
            <>
              {quien} {desde === "en_espera" ? "retomó" : "tomó"} el ticket
            </>
          ),
        };
      if (hacia === "en_espera") return { texto: <>{quien} lo puso en espera</>, nota, etiquetaNota: "Qué se espera" };
      if (hacia === "resuelto") return { texto: <>{quien} lo resolvió</>, nota, etiquetaNota: "Solución" };
      if (hacia === "cerrado") return { texto: <>{quien} lo cerró</>, nota, etiquetaNota: "Motivo" };
      if (hacia === "abierto" && desde === "en_curso") return { texto: <>{quien} lo devolvió a la cola</> };
      if (hacia === "abierto")
        return { texto: delSolicitante ? <>{quien} lo reabrió desde el portal</> : <>{quien} lo reabrió</>, nota, etiquetaNota: "Motivo" };
      return {
        texto: (
          <>
            {quien} lo pasó a {NOMBRE_ESTADO[hacia]}
          </>
        ),
      };
    }
  }
}

const ICONO = {
  creado: PlusCircleIcon,
  comentario: MessageSquareIcon,
  estado: ArrowRightLeftIcon,
  asignacion: UserRoundIcon,
  prioridad: SignalIcon,
};

export default function Historial({ eventos, ahora, ...contexto }: { eventos: Evento[]; ahora: Date } & Contexto) {
  return (
    <ol className="mt-3 flex flex-col">
      {eventos.map((e) => {
        const d = describir(e, contexto);
        const Icono = ICONO[e.tipo];
        const resuelto = e.tipo === "estado" && e.hacia === "resuelto";
        return (
          <li
            key={e.id}
            className="relative flex gap-3 pb-5 before:absolute before:top-7 before:bottom-0 before:left-[13px] before:w-px before:bg-border last:pb-0 last:before:hidden"
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full border border-border bg-card ${resuelto ? "text-success" : "text-muted-foreground"}`}
            >
              <Icono className="size-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm">
                {d.texto}{" "}
                <time dateTime={e.creadoEn.toISOString()} title={formatearFechaHora(e.creadoEn, ahora)} className="text-muted-foreground">
                  {hace(e.creadoEn, ahora)}
                </time>
              </p>
              {d.nota && (
                <div
                  className={`mt-2 max-w-[70ch] rounded-md border px-3 py-2 ${resuelto ? "border-success/40 bg-success-soft" : d.interna ? "border-dashed border-muted-foreground/40 bg-muted/60" : "border-border bg-card"}`}
                >
                  {d.etiquetaNota && (
                    <p className={`text-sm font-semibold ${d.interna ? "text-muted-foreground" : ""}`}>{d.etiquetaNota}</p>
                  )}
                  <p className="whitespace-pre-line">{d.nota}</p>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
