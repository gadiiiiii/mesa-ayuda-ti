"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SelectNativo } from "@/components/ui/input";
import { CATEGORIAS, NOMBRE_CATEGORIA, TECNICOS, type Categoria, type Regla } from "@/lib/dominio";
import { accionGuardarReglas, type EstadoFormulario } from "@/app/acciones";
import { AvisoError } from "@/app/_componentes/Campo";

const valorDe = (r: Regla) => (r.modo === "tecnico" ? `tecnico:${r.tecnico}` : r.modo);

export default function FormularioReglas({
  reglas,
  disponibles,
  carga,
}: {
  reglas: Record<Categoria, Regla>;
  disponibles: string[];
  carga: Record<string, number>;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionGuardarReglas, {});
  useEffect(() => {
    if (estado.ok) toast("Reglas guardadas.");
  }, [estado.ok]);

  return (
    <form action={enviar} className="mt-6 flex flex-col gap-6">
      <section aria-labelledby="titulo-reglas" className="rounded-lg border border-border bg-card p-5">
        <h2 id="titulo-reglas" className="text-lg font-bold">
          Por categoría
        </h2>
        <div className="mt-3 flex flex-col divide-y divide-border">
          {CATEGORIAS.map((c) => (
            <div key={c} className="grid items-center gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_16rem]">
              <label htmlFor={`regla-${c}`} className="font-semibold">
                {NOMBRE_CATEGORIA[c]}
              </label>
              <SelectNativo id={`regla-${c}`} name={`regla-${c}`} defaultValue={valorDe(reglas[c])}>
                <option value="cola">Dejar en la cola</option>
                <option value="menos_carga">Al de menos pendientes</option>
                {TECNICOS.map((t) => (
                  <option key={t} value={`tecnico:${t}`}>
                    Siempre a {t}
                  </option>
                ))}
              </SelectNativo>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="titulo-disponibles" className="rounded-lg border border-border bg-card p-5">
        <h2 id="titulo-disponibles" className="text-lg font-bold">
          Técnicos disponibles
        </h2>
        <p id="ayuda-disponibles" className="mt-1 text-sm text-muted-foreground">
          Desmarca a quien esté de vacaciones o con licencia: no recibe tickets nuevos, y los de su especialidad se reparten entre los
          demás.
        </p>
        <div role="group" aria-labelledby="titulo-disponibles" aria-describedby="ayuda-disponibles" className="mt-3 flex flex-col gap-1">
          {TECNICOS.map((t) => (
            <label key={t} className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                name="disponible"
                value={t}
                defaultChecked={disponibles.includes(t)}
                className="size-4 accent-[var(--primary)]"
              />
              <span className="font-semibold">{t}</span>
              <span className="text-sm text-muted-foreground">
                {carga[t] ?? 0} {(carga[t] ?? 0) === 1 ? "pendiente" : "pendientes"}
              </span>
            </label>
          ))}
        </div>
      </section>

      <AvisoError mensaje={estado.ok ? undefined : estado.mensaje} />
      <Button type="submit" disabled={enviando} className="self-start">
        {enviando ? "Guardando…" : "Guardar reglas"}
      </Button>
    </form>
  );
}
