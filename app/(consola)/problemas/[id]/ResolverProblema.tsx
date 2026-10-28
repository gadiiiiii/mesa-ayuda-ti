"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { accionResolverProblema, type EstadoFormulario } from "@/app/acciones";
import Campo, { AvisoError } from "@/app/_componentes/Campo";

export default function ResolverProblema({ id, pendientes }: { id: number; pendientes: number }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionResolverProblema, {});
  const v = estado.valores ?? {};
  const e = estado.errores ?? {};
  useEffect(() => {
    if (estado.ok && estado.mensaje) toast(estado.mensaje);
  }, [estado.ok, estado.mensaje]);
  return (
    <form action={enviar} className="mt-3 flex flex-col gap-4" noValidate>
      <input type="hidden" name="id" value={id} />
      <Campo id="causa" etiqueta="Causa" ayuda="Qué lo provocaba. Queda para la próxima vez." error={e.causa}>
        {(p) => <Textarea {...p} rows={3} defaultValue={v.causa} />}
      </Campo>
      <Campo id="solucion" etiqueta="Solución" ayuda="Lo leen los solicitantes de los tickets que se resuelvan." error={e.solucion}>
        {(p) => <Textarea {...p} rows={3} defaultValue={v.solucion} />}
      </Campo>
      {pendientes > 0 && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="resolverTickets" defaultChecked className="mt-0.5 size-4 accent-[var(--primary)]" />
          Resolver también {pendientes === 1 ? "el ticket pendiente" : `los ${pendientes} tickets pendientes`} con esta solución
        </label>
      )}
      <AvisoError mensaje={estado.ok ? undefined : estado.mensaje} />
      <Button type="submit" disabled={enviando} className="self-start">
        {enviando ? "Resolviendo…" : "Resolver problema"}
      </Button>
    </form>
  );
}
