"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { accionResponderSolicitante, type EstadoFormulario } from "@/app/acciones";
import Campo, { AvisoError } from "@/app/_componentes/Campo";

export default function Responder({ codigo, resuelto }: { codigo: string; resuelto: boolean }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionResponderSolicitante, {});
  useEffect(() => {
    if (estado.ok && estado.mensaje) toast(estado.mensaje);
  }, [estado.ok, estado.mensaje]);

  return (
    <section aria-labelledby="titulo-responder" className="mt-8 rounded-lg border border-border bg-card p-5">
      <h2 id="titulo-responder" className="text-lg font-bold">
        {resuelto ? "¿Sigue el problema?" : "Agregar información"}
      </h2>
      <form action={enviar} className="mt-3 flex flex-col gap-3" noValidate>
        <input type="hidden" name="codigo" value={codigo} />
        <Campo
          id="texto"
          etiqueta="Tu mensaje"
          ayuda={
            resuelto
              ? "Si marcas la casilla, tu solicitud vuelve a la cola de Informática."
              : "El técnico lo ve en el historial de tu solicitud."
          }
          error={estado.errores?.texto}
        >
          {(p) => <Textarea {...p} rows={3} defaultValue={estado.ok ? "" : estado.valores?.texto} />}
        </Campo>
        {resuelto && (
          <label className="flex items-center gap-2">
            <input type="checkbox" name="reabrir" defaultChecked className="size-4 accent-[var(--primary)]" />
            El problema sigue: reabrir la solicitud
          </label>
        )}
        <AvisoError mensaje={estado.mensaje && !estado.ok ? estado.mensaje : undefined} />
        <Button type="submit" variant="outline" disabled={enviando} className="self-start">
          {enviando ? "Enviando…" : "Enviar mensaje"}
        </Button>
      </form>
    </section>
  );
}
