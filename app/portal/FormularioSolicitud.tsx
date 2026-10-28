"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input, SelectNativo, Textarea } from "@/components/ui/input";
import { CATEGORIAS, IMPACTOS, NOMBRE_CATEGORIA, UNIDADES } from "@/lib/dominio";
import { accionCrearSolicitud, type EstadoFormulario } from "@/app/acciones";
import Campo, { AvisoError } from "@/app/_componentes/Campo";

export default function FormularioSolicitud() {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionCrearSolicitud, {});
  const v = estado.valores ?? {};
  const e = estado.errores ?? {};
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.intento) form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [estado.intento]);

  return (
    <form
      ref={form}
      key={estado.intento ?? 0}
      action={enviar}
      className="mt-6 flex flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:p-6"
      noValidate
    >
      <AvisoError mensaje={estado.mensaje} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="solicitante" etiqueta="Tu nombre" error={e.solicitante}>
          {(p) => <Input {...p} defaultValue={v.solicitante} autoComplete="name" />}
        </Campo>
        <Campo id="unidad" etiqueta="Tu unidad" error={e.unidad}>
          {(p) => (
            <SelectNativo {...p} defaultValue={v.unidad ?? ""}>
              <option value="" disabled>
                Elige tu unidad
              </option>
              {UNIDADES.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </SelectNativo>
          )}
        </Campo>
      </div>

      <Campo id="titulo" etiqueta="Qué pasa" ayuda="Una frase corta, por ejemplo «No puedo entrar al correo»." error={e.titulo}>
        {(p) => <Input {...p} defaultValue={v.titulo} maxLength={120} autoComplete="off" />}
      </Campo>

      <Campo
        id="descripcion"
        etiqueta="Cuéntanos más"
        ayuda="Desde cuándo pasa, qué mensaje aparece y qué intentaste."
        error={e.descripcion}
      >
        {(p) => <Textarea {...p} defaultValue={v.descripcion} rows={5} maxLength={4000} />}
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="categoria" etiqueta="De qué se trata" error={e.categoria}>
          {(p) => (
            <SelectNativo {...p} defaultValue={v.categoria ?? ""}>
              <option value="" disabled>
                Elige una opción
              </option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {NOMBRE_CATEGORIA[c]}
                </option>
              ))}
            </SelectNativo>
          )}
        </Campo>
        <Campo
          id="codigoEquipo"
          etiqueta="Código del equipo"
          opcional
          ayuda="Está en la etiqueta pegada al equipo, por ejemplo NB-0007."
          error={e.codigoEquipo}
        >
          {(p) => <Input {...p} defaultValue={v.codigoEquipo} autoComplete="off" spellCheck={false} className="font-mono uppercase" />}
        </Campo>
      </div>

      <fieldset aria-describedby={e.prioridad ? "prioridad-error" : undefined}>
        <legend className="text-sm font-semibold">¿Cuánto te afecta?</legend>
        <div className="mt-1.5 flex flex-col gap-2">
          {IMPACTOS.map((x) => (
            <label
              key={x.prioridad}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2.5 transition-colors hover:border-muted-foreground has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/30"
            >
              <input
                type="radio"
                name="prioridad"
                value={x.prioridad}
                defaultChecked={v.prioridad === x.prioridad}
                aria-invalid={e.prioridad ? true : undefined}
                className="size-4 accent-[var(--primary)]"
              />
              {x.texto}
            </label>
          ))}
        </div>
        {e.prioridad && (
          <p id="prioridad-error" className="mt-1.5 text-sm font-semibold text-destructive">
            {e.prioridad}
          </p>
        )}
      </fieldset>

      <div className="border-t border-border pt-5">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </div>
    </form>
  );
}
