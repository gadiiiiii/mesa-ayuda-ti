"use client";

import { useActionState, useEffect, useState } from "react";
import { RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { accionRestablecer, type EstadoFormulario } from "@/app/acciones";

/** Esta es una demo pública: cualquiera puede volver a los datos de ejemplo. Pide confirmación en dos pasos. */
export default function Restablecer() {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionRestablecer, {});
  const [confirmando, setConfirmando] = useState(false);
  useEffect(() => {
    if (estado.ok) {
      toast(estado.mensaje);
      setConfirmando(false);
    }
  }, [estado.ok, estado.mensaje]);

  return (
    <section aria-labelledby="titulo-demo" className="mt-12 border-t border-border pt-5">
      <h2 id="titulo-demo" className="font-bold">
        Demo pública
      </h2>
      <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
        Los tickets, equipos y nombres son inventados y cualquier visitante puede modificarlos. Si alguien los dejó en mal estado, puedes
        volver a los datos de ejemplo.
      </p>
      <form action={enviar} className="mt-3 flex flex-wrap items-center gap-3">
        {confirmando ? (
          <>
            <p className="font-semibold">Se borrarán todos los cambios. ¿Seguir?</p>
            <Button type="submit" variant="destructive" disabled={enviando}>
              {enviando ? "Restableciendo…" : "Sí, restablecer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={() => setConfirmando(true)}>
            <RotateCcwIcon /> Restablecer datos de ejemplo
          </Button>
        )}
      </form>
    </section>
  );
}
