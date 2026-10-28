"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, SelectNativo, Textarea } from "@/components/ui/input";
import { CATEGORIAS, NOMBRE_CATEGORIA } from "@/lib/dominio";
import { accionGuardarArticulo, type EstadoFormulario } from "@/app/acciones";
import Campo, { AvisoError } from "@/app/_componentes/Campo";

export default function FormularioArticulo({ id, ticketId, inicial }: { id?: number; ticketId?: number; inicial: Record<string, string> }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionGuardarArticulo, { valores: inicial });
  const v = estado.valores ?? {};
  const e = estado.errores ?? {};
  return (
    <form
      key={estado.intento ?? 0}
      action={enviar}
      className="mt-6 flex flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:p-6"
      noValidate
    >
      {id && <input type="hidden" name="id" value={id} />}
      {ticketId && <input type="hidden" name="ticketId" value={ticketId} />}
      <AvisoError mensaje={estado.mensaje} />
      <Campo
        id="titulo"
        etiqueta="Título"
        ayuda="Como lo buscaría alguien con el problema, por ejemplo «La impresora no imprime»."
        error={e.titulo}
      >
        {(p) => <Input {...p} defaultValue={v.titulo} maxLength={140} autoComplete="off" />}
      </Campo>
      <Campo id="categoria" etiqueta="Categoría" error={e.categoria}>
        {(p) => (
          <SelectNativo {...p} defaultValue={v.categoria ?? ""} className="sm:max-w-xs">
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
      <Campo
        id="contenido"
        etiqueta="Contenido"
        ayuda="Separa los párrafos con una línea en blanco. Las líneas que empiezan con «1.» o «-» se muestran como listas."
        error={e.contenido}
      >
        {(p) => <Textarea {...p} defaultValue={v.contenido} rows={14} className="font-normal" />}
      </Campo>
      <label className="flex items-start gap-2">
        <input type="checkbox" name="publico" defaultChecked={v.publico === "on"} className="mt-1 size-4 accent-[var(--primary)]" />
        <span>
          Mostrar en el portal
          <span className="block text-sm text-muted-foreground">
            Desmárcalo si son pasos solo para técnicos (claves, configuraciones internas).
          </span>
        </span>
      </label>
      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : id ? "Guardar cambios" : "Publicar artículo"}
        </Button>
        <Button asChild variant="outline">
          <Link href={id ? `/conocimiento/${id}` : "/conocimiento"}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
