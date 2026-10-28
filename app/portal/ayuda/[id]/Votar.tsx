"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { accionVotarArticulo, type EstadoFormulario } from "@/app/acciones";

export default function Votar({ id }: { id: number }) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionVotarArticulo, {});
  return (
    <section aria-labelledby="titulo-voto" className="mt-6 rounded-lg border border-border bg-card p-5">
      <h2 id="titulo-voto" className="font-semibold">
        ¿Te sirvió este artículo?
      </h2>
      {estado.ok ? (
        <p role="status" className="mt-2">
          {estado.mensaje}
        </p>
      ) : (
        <form action={enviar} className="mt-2 flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={id} />
          <Button type="submit" name="util" value="si" variant="outline" size="sm" disabled={enviando}>
            Sí
          </Button>
          <Button type="submit" name="util" value="no" variant="outline" size="sm" disabled={enviando}>
            No
          </Button>
        </form>
      )}
      <p className="mt-3 text-sm text-muted-foreground">
        ¿Necesitas que alguien lo revise?{" "}
        <Link href="/portal" className="font-semibold text-primary hover:underline">
          Pide ayuda a Informática
        </Link>
      </p>
    </section>
  );
}
