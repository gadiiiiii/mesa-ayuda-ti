"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { accionComentar, type EstadoFormulario } from "../../acciones";
import Campo, { AvisoError } from "../../_componentes/Campo";

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
      <AvisoError mensaje={estado.mensaje} />
      <Button type="submit" variant="outline" disabled={enviando} className="self-start">
        {enviando ? "Guardando…" : "Comentar"}
      </Button>
    </form>
  );
}
