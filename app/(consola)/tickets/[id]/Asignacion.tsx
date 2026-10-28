"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SelectNativo } from "@/components/ui/input";
import { NOMBRE_PRIORIDAD, PRIORIDADES, TECNICOS, type Prioridad } from "@/lib/dominio";
import { accionAsignar, type EstadoFormulario } from "@/app/acciones";
import { AvisoError } from "@/app/_componentes/Campo";

export default function Asignacion({ id, tecnico, prioridad }: { id: number; tecnico: string | null; prioridad: Prioridad }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionAsignar, {});
  useEffect(() => {
    if (estado.ok && estado.mensaje) toast(estado.mensaje);
  }, [estado.ok, estado.mensaje]);

  return (
    // La key vuelve a montar el formulario cuando cambian los datos del servidor.
    <form key={`${tecnico}-${prioridad}`} action={enviar} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tecnico" className="text-sm font-semibold">
          Técnico
        </label>
        <SelectNativo id="tecnico" name="tecnico" defaultValue={tecnico ?? ""}>
          <option value="">Sin asignar</option>
          {TECNICOS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </SelectNativo>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="prioridad" className="text-sm font-semibold">
          Prioridad
        </label>
        <SelectNativo id="prioridad" name="prioridad" defaultValue={prioridad} aria-describedby="prioridad-ayuda">
          {PRIORIDADES.toReversed().map((p) => (
            <option key={p} value={p}>
              {NOMBRE_PRIORIDAD[p]}
            </option>
          ))}
        </SelectNativo>
        <p id="prioridad-ayuda" className="text-sm text-muted-foreground">
          Cambiarla recalcula el plazo desde que se creó el ticket.
        </p>
      </div>
      <AvisoError mensaje={estado.ok ? undefined : estado.mensaje} />
      <Button type="submit" variant="outline" disabled={enviando} className="self-start">
        {enviando ? "Guardando…" : "Guardar asignación"}
      </Button>
    </form>
  );
}
