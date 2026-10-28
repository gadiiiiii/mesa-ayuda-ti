"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { Respuesta } from "@/lib/db/esquema";
import { accionEliminarRespuesta, accionGuardarRespuesta, type EstadoFormulario } from "@/app/acciones";
import Campo from "@/app/_componentes/Campo";

/** Una respuesta predefinida: se ve como tarjeta y se edita en el lugar. Sin `respuesta`, crea una nueva. */
export default function EditorRespuesta({ respuesta }: { respuesta?: Respuesta }) {
  const [editando, setEditando] = useState(!respuesta);
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionGuardarRespuesta, {});
  const uid = useId();
  useEffect(() => {
    if (!estado.ok) return;
    toast(estado.mensaje);
    if (respuesta) setEditando(false);
  }, [estado.ok, estado.mensaje, respuesta]);

  if (!editando && respuesta) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="font-semibold">{respuesta.titulo}</p>
        <p className="mt-1 whitespace-pre-line text-muted-foreground">{respuesta.texto}</p>
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setEditando(true)}>
            Editar
          </Button>
          <form action={accionEliminarRespuesta}>
            <input type="hidden" name="id" value={respuesta.id} />
            <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:bg-destructive-soft">
              Eliminar
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <form
      key={respuesta ? "editar" : (estado.ok ?? 0)}
      action={enviar}
      className="mt-2 flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
      noValidate
    >
      {respuesta && <input type="hidden" name="id" value={respuesta.id} />}
      <Campo id={`${uid}-titulo`} etiqueta="Nombre" error={estado.errores?.titulo}>
        {(p) => <Input {...p} name="titulo" defaultValue={estado.ok ? undefined : (estado.valores?.titulo ?? respuesta?.titulo)} />}
      </Campo>
      <Campo id={`${uid}-texto`} etiqueta="Texto" error={estado.errores?.texto}>
        {(p) => (
          <Textarea {...p} name="texto" rows={3} defaultValue={estado.ok ? undefined : (estado.valores?.texto ?? respuesta?.texto)} />
        )}
      </Campo>
      <div className="flex gap-2">
        <Button type="submit" variant={respuesta ? "default" : "outline"} disabled={enviando}>
          {enviando ? "Guardando…" : respuesta ? "Guardar" : "Agregar respuesta"}
        </Button>
        {respuesta && (
          <Button type="button" variant="outline" onClick={() => setEditando(false)}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
