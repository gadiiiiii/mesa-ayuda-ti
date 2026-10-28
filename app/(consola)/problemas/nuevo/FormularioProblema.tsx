"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { accionCrearProblema, type EstadoFormulario } from "@/app/acciones";
import Campo, { AvisoError } from "@/app/_componentes/Campo";

export default function FormularioProblema({ ticketId }: { ticketId?: number }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionCrearProblema, {});
  const v = estado.valores ?? {};
  const e = estado.errores ?? {};
  return (
    <form
      key={estado.intento ?? 0}
      action={enviar}
      className="mt-6 flex flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:p-6"
      noValidate
    >
      {ticketId && <input type="hidden" name="id" value={ticketId} />}
      <AvisoError mensaje={estado.mensaje} />
      <Campo id="titulo" etiqueta="Título" ayuda="Lo que tienen en común, por ejemplo «Se cae el switch de Obras»." error={e.titulo}>
        {(p) => <Input {...p} defaultValue={v.titulo} maxLength={120} autoComplete="off" />}
      </Campo>
      <Campo id="descripcion" etiqueta="Qué se sabe" opcional ayuda="Síntomas, desde cuándo, qué unidades afecta." error={e.descripcion}>
        {(p) => <Textarea {...p} defaultValue={v.descripcion} rows={4} />}
      </Campo>
      <div className="border-t border-border pt-5">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Creando…" : "Crear problema"}
        </Button>
      </div>
    </form>
  );
}
