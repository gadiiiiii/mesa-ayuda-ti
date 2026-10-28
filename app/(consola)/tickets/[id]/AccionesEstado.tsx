"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ACCIONES, NOMBRE_ESTADO, type Accion, type Estado } from "@/lib/dominio";
import { accionCambiarEstado, type EstadoFormulario } from "@/app/acciones";
import { AvisoError } from "@/app/_componentes/Campo";

/** Botones para mover el ticket de estado. Los que necesitan una nota la piden antes de confirmar. */
export default function AccionesEstado({ id, estado }: { id: number; estado: Estado }) {
  const [estadoForm, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionCambiarEstado, {});
  const [conNota, setConNota] = useState<Accion | null>(null);
  const [ultimo, setUltimo] = useState<Estado | null>(null);

  useEffect(() => {
    if (estadoForm.ok && ultimo) {
      toast(`Ticket ${NOMBRE_ESTADO[ultimo].toLowerCase()}.`);
      setConNota(null);
    }
    // Solo cuando llega una respuesta nueva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoForm.ok]);

  const acciones = ACCIONES[estado];

  if (conNota) {
    return (
      <form action={enviar} className="mt-3 flex flex-col gap-3" onSubmit={() => setUltimo(conNota.hacia)}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="hacia" value={conNota.hacia} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nota" className="text-sm font-semibold">
            {conNota.nota!.etiqueta}
          </label>
          <Textarea
            id="nota"
            name="nota"
            rows={4}
            required
            autoFocus
            aria-describedby="nota-ayuda"
            defaultValue={estadoForm.valores?.nota}
          />
          <p id="nota-ayuda" className="text-sm text-muted-foreground">
            {conNota.nota!.ayuda}
          </p>
        </div>
        <AvisoError mensaje={estadoForm.mensaje} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : conNota.etiqueta}
          </Button>
          <Button type="button" variant="outline" onClick={() => setConNota(null)}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form action={enviar} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      {acciones.map((a, i) =>
        a.nota ? (
          <Button
            key={a.hacia}
            type="button"
            variant={i === 0 ? "default" : "outline"}
            onClick={() => setConNota(a)}
            className="justify-start"
          >
            {a.etiqueta}…
          </Button>
        ) : (
          <Button
            key={a.hacia}
            type="submit"
            name="hacia"
            value={a.hacia}
            variant={i === 0 ? "default" : "outline"}
            disabled={enviando}
            onClick={() => setUltimo(a.hacia)}
            className="justify-start"
          >
            {a.etiqueta}
          </Button>
        ),
      )}
      <AvisoError mensaje={estadoForm.mensaje} />
    </form>
  );
}
