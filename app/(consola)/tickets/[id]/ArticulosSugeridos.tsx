"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { accionEnviarArticulo, type EstadoFormulario } from "@/app/acciones";
import { AvisoError } from "@/app/_componentes/Campo";

/** Artículos parecidos al ticket. Los públicos se pueden mandar al solicitante como respuesta. */
export default function ArticulosSugeridos({
  id,
  articulos,
}: {
  id: number;
  articulos: { id: number; titulo: string; publico: boolean }[];
}) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accionEnviarArticulo, {});
  useEffect(() => {
    if (estado.ok && estado.mensaje) toast(estado.mensaje);
  }, [estado.ok, estado.mensaje]);

  if (!articulos.length) return <p className="mt-2 text-sm text-muted-foreground">No hay artículos parecidos.</p>;
  return (
    <>
      <ul className="mt-3 flex flex-col gap-3 text-sm">
        {articulos.map((a) => (
          <li key={a.id} className="flex flex-col gap-1">
            <Link href={`/conocimiento/${a.id}`} className="font-semibold text-primary hover:underline">
              {a.titulo}
            </Link>
            {a.publico ? (
              <form action={enviar}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="articulo" value={a.id} />
                <Button type="submit" variant="outline" size="sm" disabled={enviando}>
                  Enviar al solicitante
                </Button>
              </form>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <EyeOffIcon className="size-3.5" aria-hidden="true" /> Solo técnicos
              </span>
            )}
          </li>
        ))}
      </ul>
      <AvisoError mensaje={estado.ok ? undefined : estado.mensaje} />
    </>
  );
}
