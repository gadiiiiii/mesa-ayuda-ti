import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizarCodigo } from "@/lib/codigo";
import { obtenerSeguimiento } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { texto, type Parametros } from "@/app/_componentes/parametros";

export const metadata: Metadata = { title: "Revisar mi solicitud" };

export default async function BuscarSeguimiento({ searchParams }: { searchParams: Promise<Parametros> }) {
  const escrito = texto(await searchParams, "codigo");
  let error: string | null = null;
  if (escrito) {
    const codigo = normalizarCodigo(escrito);
    if (!codigo) error = "El código tiene 8 letras y números, por ejemplo ABCD-2345.";
    else if (await obtenerSeguimiento(await obtenerBD(), codigo)) redirect(`/portal/seguimiento/${codigo}`);
    else error = `No encontramos una solicitud con el código ${codigo}. Revisa que esté bien escrito.`;
  }
  return (
    <div className="mx-auto max-w-[32rem]">
      <h1 className="text-3xl font-bold">Revisar mi solicitud</h1>
      <p className="mt-1 text-muted-foreground">Escribe el código que te dimos al enviarla.</p>
      <form action="/portal/seguimiento" className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
        <label htmlFor="codigo" className="text-sm font-semibold">
          Código de seguimiento
        </label>
        <input
          id="codigo"
          name="codigo"
          required
          defaultValue={escrito}
          autoComplete="off"
          spellCheck={false}
          placeholder="ABCD-2345"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "codigo-error" : undefined}
          className="h-11 w-full rounded-md border border-border bg-card px-3 font-mono text-lg uppercase outline-none placeholder:text-muted-foreground/70 hover:border-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/25 aria-invalid:border-destructive"
        />
        {error && (
          <p id="codigo-error" className="flex items-start gap-1 text-sm font-semibold text-destructive">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        <Button type="submit" className="self-start">
          Ver mi solicitud
        </Button>
      </form>
    </div>
  );
}
