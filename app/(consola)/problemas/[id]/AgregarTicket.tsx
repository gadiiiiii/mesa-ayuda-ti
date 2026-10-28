"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { accionAgregarAProblema, type EstadoFormulario } from "@/app/acciones";

export default function AgregarTicket({ problemaId }: { problemaId: number }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionAgregarAProblema, {});
  useEffect(() => {
    if (estado.ok && estado.mensaje) toast(estado.mensaje);
  }, [estado.ok, estado.mensaje]);
  return (
    <form action={enviar} className="mt-4 flex flex-col gap-1.5 text-sm" noValidate>
      <input type="hidden" name="problemaId" value={problemaId} />
      <label htmlFor="folio-agregar" className="font-semibold">
        Agregar otro ticket
      </label>
      <div className="flex max-w-md gap-2">
        <Input
          id="folio-agregar"
          name="folio"
          inputMode="numeric"
          placeholder="Número, por ejemplo 12"
          defaultValue={estado.ok ? "" : estado.valores?.folio}
          aria-invalid={estado.errores?.folio ? true : undefined}
          aria-describedby={estado.errores?.folio ? "folio-agregar-error" : undefined}
          className="min-w-0 flex-1"
        />
        <Button type="submit" variant="outline" disabled={enviando}>
          Agregar
        </Button>
      </div>
      {estado.errores?.folio && (
        <p id="folio-agregar-error" className="font-semibold text-destructive">
          {estado.errores.folio}
        </p>
      )}
    </form>
  );
}
