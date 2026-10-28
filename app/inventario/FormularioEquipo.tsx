"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, SelectNativo, Textarea } from "@/components/ui/input";
import {
  ESTADOS_EQUIPO,
  NOMBRE_ESTADO_EQUIPO,
  NOMBRE_TIPO,
  PREFIJO_TIPO,
  TIPOS_DE_RED,
  TIPOS_EQUIPO,
  UNIDADES,
  type TipoEquipo,
} from "@/lib/dominio";
import { accionGuardarEquipo, type EstadoFormulario } from "../acciones";
import Campo, { AvisoError } from "../_componentes/Campo";

/** Alta y edición de un equipo. Al editar, el tipo queda fijo porque el código depende de él. */
export default function FormularioEquipo({ id, codigo, inicial }: { id?: number; codigo?: string; inicial: Record<string, string> }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionGuardarEquipo, { valores: inicial });
  const v = estado.valores ?? {};
  const form = useRef<HTMLFormElement>(null);
  // Después de un envío con errores, el foco va al primer campo que hay que corregir.
  useEffect(() => {
    if (estado.intento) form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [estado.intento]);
  const e = estado.errores ?? {};
  const [tipo, setTipo] = useState<TipoEquipo | "">((v.tipo as TipoEquipo) ?? "");
  const deRed = tipo !== "" && TIPOS_DE_RED.includes(tipo);

  return (
    <form
      ref={form}
      key={estado.intento ?? 0}
      action={enviar}
      className="mt-6 flex flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:p-6"
      noValidate
    >
      {id && <input type="hidden" name="id" value={id} />}
      <AvisoError mensaje={estado.mensaje} />

      <div className="grid gap-5 sm:grid-cols-2">
        {id ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Tipo</span>
            <input type="hidden" name="tipo" value={tipo} />
            <p className="flex h-10 items-center">{tipo && NOMBRE_TIPO[tipo]}</p>
            <p className="text-sm text-muted-foreground">El tipo no se cambia: el código {codigo} depende de él.</p>
          </div>
        ) : (
          <Campo
            id="tipo"
            etiqueta="Tipo"
            error={e.tipo}
            ayuda={
              tipo
                ? `El código empezará con ${PREFIJO_TIPO[tipo]}- y se asigna solo.`
                : "El código de inventario se asigna solo según el tipo."
            }
          >
            {(p) => (
              <SelectNativo {...p} defaultValue={v.tipo ?? ""} onChange={(ev) => setTipo(ev.target.value as TipoEquipo)}>
                <option value="" disabled>
                  Elige el tipo
                </option>
                {TIPOS_EQUIPO.map((t) => (
                  <option key={t} value={t}>
                    {NOMBRE_TIPO[t]}
                  </option>
                ))}
              </SelectNativo>
            )}
          </Campo>
        )}
        <Campo id="estado" etiqueta="Estado" error={e.estado}>
          {(p) => (
            <SelectNativo {...p} defaultValue={v.estado ?? "en_uso"}>
              {ESTADOS_EQUIPO.map((x) => (
                <option key={x} value={x}>
                  {NOMBRE_ESTADO_EQUIPO[x]}
                </option>
              ))}
            </SelectNativo>
          )}
        </Campo>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="marca" etiqueta="Marca" error={e.marca}>
          {(p) => <Input {...p} defaultValue={v.marca} autoComplete="off" />}
        </Campo>
        <Campo id="modelo" etiqueta="Modelo" error={e.modelo}>
          {(p) => <Input {...p} defaultValue={v.modelo} autoComplete="off" />}
        </Campo>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="unidad" etiqueta="Unidad" error={e.unidad}>
          {(p) => (
            <SelectNativo {...p} defaultValue={v.unidad ?? ""}>
              <option value="" disabled>
                Elige la unidad
              </option>
              {UNIDADES.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </SelectNativo>
          )}
        </Campo>
        <Campo id="responsable" etiqueta="Responsable" opcional ayuda="Quién lo usa. Vacío si es compartido." error={e.responsable}>
          {(p) => <Input {...p} defaultValue={v.responsable} autoComplete="off" />}
        </Campo>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="serie" etiqueta="Número de serie" opcional error={e.serie}>
          {(p) => <Input {...p} defaultValue={v.serie} autoComplete="off" spellCheck={false} className="font-mono" />}
        </Campo>
        <Campo id="fechaCompra" etiqueta="Fecha de compra" opcional error={e.fechaCompra}>
          {(p) => <Input {...p} type="date" defaultValue={v.fechaCompra} />}
        </Campo>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          id="ip"
          etiqueta="Dirección IP"
          opcional={!deRed}
          ayuda={deRed ? "Este tipo de equipo suele tener IP fija." : "Solo si tiene IP fija."}
          error={e.ip}
        >
          {(p) => (
            <Input
              {...p}
              defaultValue={v.ip}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              placeholder="192.168.10.25"
              className="font-mono"
            />
          )}
        </Campo>
        <Campo id="mac" etiqueta="Dirección MAC" opcional ayuda="Con dos puntos, guiones o en formato Cisco." error={e.mac}>
          {(p) => (
            <Input
              {...p}
              defaultValue={v.mac}
              autoComplete="off"
              spellCheck={false}
              placeholder="00:1A:2B:3C:4D:5E"
              className="font-mono"
            />
          )}
        </Campo>
      </div>

      <Campo id="notas" etiqueta="Notas" opcional error={e.notas}>
        {(p) => <Textarea {...p} defaultValue={v.notas} rows={3} />}
      </Campo>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : id ? "Guardar cambios" : "Agregar equipo"}
        </Button>
        <Button asChild variant="outline">
          <Link href={id ? `/inventario/${id}` : "/inventario"}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
