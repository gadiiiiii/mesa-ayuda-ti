"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { accionComentar, type EstadoFormulario } from "@/app/acciones";
import Campo, { AvisoError } from "@/app/_componentes/Campo";

export default function Comentar({ id }: { id: number }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionComentar, {});
  return (
    <form action={enviar} className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4" noValidate>
      <input type="hidden" name="id" value={id} />
      <Campo
        id="texto"
        etiqueta="Agregar un comentario"
        ayuda="Queda en el historial con tu nombre y la hora."
        error={estado.errores?.texto}
      >
        {(p) => <Textarea {...p} rows={3} defaultValue={estado.ok ? "" : estado.valores?.texto} />}
      </Campo>
      <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <legend className="sr-only">Quién lo ve</legend>
        <label className="flex min-h-11 items-center gap-2 sm:min-h-0">
          <input type="radio" name="publico" value="" defaultChecked className="size-4 accent-[var(--primary)]" />
          Nota interna, solo técnicos
        </label>
        <label className="flex min-h-11 items-center gap-2 sm:min-h-0">
          <input type="radio" name="publico" value="on" className="size-4 accent-[var(--primary)]" />
          Respuesta que ve el solicitante
        </label>
      </fieldset>
      <AvisoError mensaje={estado.mensaje} />
      <Button type="submit" variant="outline" disabled={enviando} className="self-start">
        {enviando ? "Guardando…" : "Comentar"}
      </Button>
    </form>
  );
}
