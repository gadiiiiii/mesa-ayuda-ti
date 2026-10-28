"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { SelectNativo, Textarea } from "@/components/ui/input";
import { accionComentar, type EstadoFormulario } from "@/app/acciones";
import Campo, { AvisoError } from "@/app/_componentes/Campo";

/** `respuestas`: las predefinidas, ya con el nombre del solicitante, el técnico y el folio. */
export default function Comentar({ id, respuestas }: { id: number; respuestas: { titulo: string; texto: string }[] }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionComentar, {});
  const form = useRef<HTMLFormElement>(null);

  // Una respuesta predefinida reemplaza el texto y se marca como visible para el solicitante.
  const usar = (i: number) => {
    const f = form.current;
    const r = respuestas[i];
    if (!f || !r) return;
    const area = f.querySelector<HTMLTextAreaElement>("#texto")!;
    area.value = r.texto;
    f.querySelector<HTMLInputElement>('input[name=publico][value="on"]')!.checked = true;
    area.focus();
  };

  return (
    <form ref={form} action={enviar} className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4" noValidate>
      <input type="hidden" name="id" value={id} />
      {respuestas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="respuesta-predefinida" className="font-semibold">
            Respuesta predefinida
          </label>
          <SelectNativo
            id="respuesta-predefinida"
            value=""
            onChange={(e) => usar(Number(e.target.value))}
            className="min-w-0 flex-1 sm:max-w-xs"
          >
            <option value="" disabled>
              Elegir para insertar…
            </option>
            {respuestas.map((r, i) => (
              <option key={i} value={i}>
                {r.titulo}
              </option>
            ))}
          </SelectNativo>
        </div>
      )}
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
