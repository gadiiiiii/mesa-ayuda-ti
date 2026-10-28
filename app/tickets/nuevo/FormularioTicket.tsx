"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, SelectNativo, Textarea } from "@/components/ui/input";
import {
  CATEGORIAS,
  DESCRIPCION_PRIORIDAD,
  NOMBRE_CATEGORIA,
  NOMBRE_PRIORIDAD,
  NOMBRE_TIPO,
  PRIORIDADES,
  UNIDADES,
  type TipoEquipo,
} from "@/lib/dominio";
import { cn } from "@/lib/utils";
import { accionCrearTicket, type EstadoFormulario } from "../../acciones";
import Campo, { AvisoError } from "../../_componentes/Campo";

interface EquipoOpcion {
  id: number;
  codigo: string;
  tipo: TipoEquipo;
  marca: string;
  modelo: string;
  unidad: string;
  responsable: string | null;
}

export default function FormularioTicket({ equipos, inicial }: { equipos: EquipoOpcion[]; inicial: Record<string, string> }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionCrearTicket, { valores: inicial });
  const v = estado.valores ?? {};
  const form = useRef<HTMLFormElement>(null);
  // Después de un envío con errores, el foco va al primer campo que hay que corregir.
  useEffect(() => {
    if (estado.intento) form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [estado.intento]);
  const e = estado.errores ?? {};
  // Los campos no son controlados: si hay errores, el formulario se vuelve a montar (key) con lo que
  // se escribió como `defaultValue`. El estado solo sirve para ordenar los equipos y resaltar la prioridad.
  const [unidad, setUnidad] = useState(v.unidad ?? "");
  const [prioridad, setPrioridad] = useState(v.prioridad ?? "media");

  // Primero los equipos de la unidad elegida.
  const grupos = [...new Set(equipos.map((x) => x.unidad))].sort((a, b) => (a === unidad ? -1 : b === unidad ? 1 : a.localeCompare(b)));

  return (
    <form
      ref={form}
      key={estado.intento ?? 0}
      action={enviar}
      className="mt-6 flex flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:p-6"
      noValidate
    >
      <AvisoError mensaje={estado.mensaje} />

      <Campo id="titulo" etiqueta="Qué pasa" ayuda="Una frase corta, por ejemplo «La impresora no imprime»." error={e.titulo}>
        {(p) => <Input {...p} defaultValue={v.titulo} maxLength={120} autoComplete="off" />}
      </Campo>

      <Campo id="descripcion" etiqueta="Detalle" ayuda="Desde cuándo pasa, qué mensaje aparece y qué se intentó." error={e.descripcion}>
        {(p) => <Textarea {...p} defaultValue={v.descripcion} rows={5} maxLength={4000} />}
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="solicitante" etiqueta="Quién lo pide" error={e.solicitante}>
          {(p) => <Input {...p} defaultValue={v.solicitante} autoComplete="off" />}
        </Campo>
        <Campo id="unidad" etiqueta="Unidad" error={e.unidad}>
          {(p) => (
            <SelectNativo {...p} defaultValue={v.unidad ?? ""} onChange={(ev) => setUnidad(ev.target.value)}>
              <option value="" disabled>
                Elige la unidad
              </option>
              {UNIDADES.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </SelectNativo>
          )}
        </Campo>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="categoria" etiqueta="Categoría" error={e.categoria}>
          {(p) => (
            <SelectNativo {...p} defaultValue={v.categoria ?? ""}>
              <option value="" disabled>
                Elige una categoría
              </option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {NOMBRE_CATEGORIA[c]}
                </option>
              ))}
            </SelectNativo>
          )}
        </Campo>
        <Campo id="equipoId" etiqueta="Equipo" opcional ayuda="Si el problema es de un equipo del inventario." error={e.equipoId}>
          {(p) => (
            <SelectNativo {...p} defaultValue={v.equipoId ?? ""}>
              <option value="">Ninguno</option>
              {grupos.map((g) => (
                <optgroup key={g} label={g}>
                  {equipos
                    .filter((x) => x.unidad === g)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.codigo}: {NOMBRE_TIPO[x.tipo]} {x.marca}
                        {x.responsable ? ` (${x.responsable})` : ""}
                      </option>
                    ))}
                </optgroup>
              ))}
            </SelectNativo>
          )}
        </Campo>
      </div>

      <fieldset aria-describedby={e.prioridad ? "prioridad-error" : undefined}>
        <legend className="text-sm font-semibold">Prioridad</legend>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {PRIORIDADES.toReversed().map((x) => (
            <label
              key={x}
              className={cn(
                "flex cursor-pointer gap-3 rounded-md border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/30",
                prioridad === x ? "border-primary bg-primary-soft" : "border-border hover:border-muted-foreground",
              )}
            >
              <input
                type="radio"
                name="prioridad"
                value={x}
                defaultChecked={(v.prioridad ?? "media") === x}
                onChange={() => setPrioridad(x)}
                className="mt-1 size-4 accent-[var(--primary)]"
              />
              <span>
                <span className="font-semibold">{NOMBRE_PRIORIDAD[x]}</span>
                <span className="block text-sm text-muted-foreground">{DESCRIPCION_PRIORIDAD[x]}</span>
              </span>
            </label>
          ))}
        </div>
        {e.prioridad && (
          <p id="prioridad-error" className="mt-1.5 text-sm font-semibold text-destructive">
            {e.prioridad}
          </p>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Creando…" : "Crear ticket"}
        </Button>
        <p className="text-sm text-muted-foreground">El plazo corre en horario de oficina, desde ahora o desde que abre.</p>
      </div>
    </form>
  );
}
