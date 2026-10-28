"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, SelectNativo } from "@/components/ui/input";
import { accionMarcarDuplicado, accionVincularProblema, type EstadoFormulario } from "@/app/acciones";
import { AvisoError } from "@/app/_componentes/Campo";

interface Props {
  id: number;
  pendiente: boolean;
  duplicadoDe: number | null;
  duplicados: { id: number; titulo: string }[];
  problema: { id: number; titulo: string; estado: "abierto" | "resuelto" } | null;
  problemasAbiertos: { id: number; titulo: string }[];
}

function useAviso(estado: EstadoFormulario) {
  useEffect(() => {
    if (estado.ok && estado.mensaje) toast(estado.mensaje);
  }, [estado.ok, estado.mensaje]);
}

/** Duplicados y problemas (ITIL) en la ficha del ticket. */
export default function Relacionados({ id, pendiente, duplicadoDe, duplicados, problema, problemasAbiertos }: Props) {
  const [vinculo, vincular, vinculando] = useActionState<EstadoFormulario, FormData>(accionVincularProblema, {});
  const [duplicado, marcar, marcando] = useActionState<EstadoFormulario, FormData>(accionMarcarDuplicado, {});
  useAviso(vinculo);
  useAviso(duplicado);

  return (
    <div className="mt-3 flex flex-col gap-4 text-sm">
      {duplicadoDe && (
        <p>
          Cerrado como duplicado del{" "}
          <Link href={`/tickets/${duplicadoDe}`} className="font-semibold text-primary hover:underline">
            ticket #{duplicadoDe}
          </Link>
          .
        </p>
      )}
      {duplicados.length > 0 && (
        <div>
          <p className="font-semibold">Duplicados de este ticket</p>
          <ul className="mt-1 flex flex-col gap-1">
            {duplicados.map((d) => (
              <li key={d.id}>
                <Link href={`/tickets/${d.id}`} className="text-primary hover:underline">
                  #{d.id} {d.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="font-semibold">Problema</p>
        {problema ? (
          <form action={vincular} className="mt-1 flex flex-col gap-2">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="problema" value="" />
            <Link href={`/problemas/${problema.id}`} className="text-primary hover:underline">
              Problema #{problema.id}: {problema.titulo}
            </Link>
            <span className="text-muted-foreground">{problema.estado === "resuelto" ? "Resuelto" : "Abierto"}</span>
            {problema.estado === "abierto" && (
              <Button type="submit" variant="outline" size="sm" disabled={vinculando} className="self-start">
                Quitar del problema
              </Button>
            )}
          </form>
        ) : (
          <>
            <p className="mt-0.5 text-muted-foreground">
              Si varios tickets tienen la misma causa, agrúpalos en un problema y resuélvelos de una vez.
            </p>
            {problemasAbiertos.length > 0 && (
              <form action={vincular} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={id} />
                <label htmlFor="problema" className="sr-only">
                  Problema abierto
                </label>
                <SelectNativo id="problema" name="problema" defaultValue="" className="min-w-0 flex-1" required>
                  <option value="" disabled>
                    Elige un problema abierto
                  </option>
                  {problemasAbiertos.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} {p.titulo}
                    </option>
                  ))}
                </SelectNativo>
                <Button type="submit" variant="outline" disabled={vinculando}>
                  Vincular
                </Button>
              </form>
            )}
            <Link
              href={`/problemas/nuevo?ticket=${id}`}
              className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary hover:underline sm:min-h-0"
            >
              Crear un problema con este ticket
            </Link>
          </>
        )}
        <AvisoError mensaje={vinculo.ok ? undefined : vinculo.mensaje} />
      </div>

      {pendiente && (
        <form action={marcar} className="flex flex-col gap-1.5 border-t border-border pt-4" noValidate>
          <input type="hidden" name="id" value={id} />
          <label htmlFor="folio-duplicado" className="font-semibold">
            ¿Es el mismo caso que otro ticket?
          </label>
          <div className="flex gap-2">
            <Input
              id="folio-duplicado"
              name="folio"
              inputMode="numeric"
              placeholder="Número, por ejemplo 12"
              defaultValue={duplicado.ok ? "" : duplicado.valores?.folio}
              aria-invalid={duplicado.errores?.folio ? true : undefined}
              aria-describedby="folio-duplicado-ayuda folio-duplicado-error"
              className="min-w-0 flex-1"
            />
            <Button type="submit" variant="outline" disabled={marcando}>
              Cerrar como duplicado
            </Button>
          </div>
          <p id="folio-duplicado-ayuda" className="text-muted-foreground">
            Este ticket se cierra y se sigue en el otro. Su solicitante ve el motivo.
          </p>
          {duplicado.errores?.folio && (
            <p id="folio-duplicado-error" className="font-semibold text-destructive">
              {duplicado.errores.folio}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
