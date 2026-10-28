"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarClockIcon, CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIPOS_MANTENCION, type EstadoMantencion } from "@/lib/dominio";
import { formatearFecha } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { accionEliminarMantencion, accionProgramarMantencion, accionRealizarMantencion, type EstadoFormulario } from "@/app/acciones";
import Campo, { AvisoError } from "@/app/_componentes/Campo";

interface Fila {
  id: number;
  tipo: string;
  programadaPara: string;
  cadaMeses: number | null;
  realizada: string | null;
  nota: string | null;
  estado: EstadoMantencion;
}

function useAviso(e: EstadoFormulario) {
  useEffect(() => {
    if (e.ok && e.mensaje) toast(e.mensaje);
  }, [e.ok, e.mensaje]);
}

const TEXTO_ESTADO: Record<EstadoMantencion, string> = {
  vencida: "Atrasada",
  proxima: "Próxima",
  programada: "Programada",
  realizada: "Realizada",
};

/** Una mantención pendiente: se marca como realizada con una nota opcional. */
export function Realizar({ id }: { id: number }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionRealizarMantencion, {});
  useAviso(estado);
  if (!abierto)
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setAbierto(true)}>
        Marcar como realizada
      </Button>
    );
  return (
    <form action={enviar} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={`nota-${id}`} className="text-sm font-semibold">
        Nota <span className="font-normal text-muted-foreground">(opcional)</span>
      </label>
      <Input id={`nota-${id}`} name="nota" placeholder="Qué se hizo o qué se encontró" />
      <AvisoError mensaje={estado.ok ? undefined : estado.mensaje} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={enviando}>
          Registrar
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export default function Mantenciones({
  equipoId,
  deBaja,
  hoy,
  mantenciones,
}: {
  equipoId: number;
  deBaja: boolean;
  hoy: string;
  mantenciones: Fila[];
}) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionProgramarMantencion, {});
  useAviso(estado);
  const pendientes = mantenciones.filter((m) => m.estado !== "realizada");
  const realizadas = mantenciones.filter((m) => m.estado === "realizada");
  const e = estado.errores ?? {};

  return (
    <div className="mt-3 flex flex-col gap-4">
      {pendientes.length === 0 && realizadas.length === 0 && (
        <p className="text-sm text-muted-foreground">No tiene mantenciones programadas.</p>
      )}
      {pendientes.length > 0 && (
        <ul className="flex flex-col gap-3">
          {pendientes.map((m) => (
            <li key={m.id} className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border p-3">
              <div>
                <p className="flex items-center gap-1.5 font-semibold">
                  <CalendarClockIcon className="size-4 text-muted-foreground" aria-hidden="true" /> {m.tipo}
                </p>
                <p
                  className={cn(
                    "text-sm",
                    m.estado === "vencida"
                      ? "font-semibold text-destructive"
                      : m.estado === "proxima"
                        ? "text-warning"
                        : "text-muted-foreground",
                  )}
                >
                  {TEXTO_ESTADO[m.estado]}: {formatearFecha(m.programadaPara)}
                  {m.cadaMeses && `, cada ${m.cadaMeses === 1 ? "mes" : `${m.cadaMeses} meses`}`}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2">
                <Realizar id={m.id} />
                <form action={accionEliminarMantencion}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-sm font-semibold text-destructive hover:underline">
                    Quitar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      {realizadas.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-primary">Realizadas ({realizadas.length})</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {realizadas.map((m) => (
              <li key={m.id} className="flex gap-2">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                <span>
                  {m.tipo}, {m.realizada}
                  {m.nota && <span className="block text-muted-foreground">{m.nota}</span>}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {!deBaja && (
        <form key={estado.ok ?? 0} action={enviar} className="flex flex-col gap-3 border-t border-border pt-4" noValidate>
          <input type="hidden" name="id" value={equipoId} />
          <p className="font-semibold">Programar una mantención</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_11rem_9rem]">
            <Campo id="tipo" etiqueta="Tipo" error={e.tipo}>
              {(p) => <Input {...p} list="tipos-mantencion" defaultValue={estado.valores?.tipo} placeholder="Limpieza" />}
            </Campo>
            <Campo id="programadaPara" etiqueta="Fecha" error={e.programadaPara}>
              {(p) => <Input {...p} type="date" min={hoy} defaultValue={estado.valores?.programadaPara} />}
            </Campo>
            <Campo id="cadaMeses" etiqueta="Cada (meses)" error={e.cadaMeses}>
              {(p) => <Input {...p} inputMode="numeric" placeholder="No se repite" defaultValue={estado.valores?.cadaMeses} />}
            </Campo>
          </div>
          <datalist id="tipos-mantencion">
            {TIPOS_MANTENCION.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <AvisoError mensaje={estado.ok ? undefined : estado.mensaje} />
          <Button type="submit" variant="outline" disabled={enviando} className="self-start">
            Programar
          </Button>
        </form>
      )}
    </div>
  );
}
