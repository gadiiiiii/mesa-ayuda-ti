"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { accionResponderEncuesta, type EstadoFormulario } from "@/app/acciones";
import { AvisoError } from "@/app/_componentes/Campo";

const NOTAS = [
  { n: 1, texto: "Muy mala" },
  { n: 2, texto: "Mala" },
  { n: 3, texto: "Regular" },
  { n: 4, texto: "Buena" },
  { n: 5, texto: "Muy buena" },
];

/** Encuesta de satisfacción (CSAT): una pregunta, del 1 al 5, y un comentario opcional. */
export default function Encuesta({ codigo }: { codigo: string }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionResponderEncuesta, {});
  if (estado.ok) {
    return (
      <section role="status" className="mt-8 rounded-lg border border-success/40 bg-success-soft p-5 font-semibold text-success">
        {estado.mensaje} Tu respuesta nos ayuda a mejorar.
      </section>
    );
  }
  return (
    <section aria-labelledby="titulo-encuesta" className="mt-8 rounded-lg border border-primary/40 bg-card p-5">
      <form action={enviar} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="codigo" value={codigo} />
        <fieldset aria-describedby={estado.errores?.nota ? "nota-error" : undefined}>
          <legend id="titulo-encuesta" className="text-lg font-bold">
            ¿Cómo te atendimos?
          </legend>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {NOTAS.map((x) => (
              <label
                key={x.n}
                className="flex cursor-pointer flex-col items-center gap-1 rounded-md border border-border px-1 py-2.5 text-center transition-colors hover:border-muted-foreground has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/30"
              >
                <input type="radio" name="nota" value={x.n} className="sr-only" />
                <span className="text-xl font-bold tabular-nums">{x.n}</span>
                <span className="text-xs text-muted-foreground">{x.texto}</span>
              </label>
            ))}
          </div>
          {estado.errores?.nota && (
            <p id="nota-error" className="mt-1.5 text-sm font-semibold text-destructive">
              {estado.errores.nota}
            </p>
          )}
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="comentario-encuesta" className="text-sm font-semibold">
            ¿Algo que quieras contarnos? <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <Textarea id="comentario-encuesta" name="comentario" rows={2} maxLength={1000} />
        </div>
        <AvisoError mensaje={estado.mensaje} />
        <Button type="submit" disabled={enviando} className="self-start">
          {enviando ? "Enviando…" : "Enviar respuesta"}
        </Button>
      </form>
    </section>
  );
}
