import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon, EyeOffIcon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obtenerArticulo } from "@/lib/conocimiento";
import { obtenerBD } from "@/lib/db";
import { NOMBRE_CATEGORIA } from "@/lib/dominio";
import { formatearFechaHora } from "@/lib/formato";
import Contenido from "@/app/_componentes/Contenido";
import Eliminar from "./Eliminar";

type Props = { params: Promise<{ id: string }> };

async function cargar(idTexto: string) {
  const id = Number(idTexto);
  return Number.isInteger(id) && id > 0 ? obtenerArticulo(await obtenerBD(), id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await cargar((await params).id);
  return { title: a?.titulo ?? "Artículo no encontrado" };
}

export default async function Articulo({ params }: Props) {
  const a = await cargar((await params).id);
  if (!a) notFound();
  const ahora = new Date();
  return (
    <div className="mx-auto max-w-[48rem]">
      <Link
        href="/conocimiento"
        className="-my-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeftIcon className="size-4" aria-hidden="true" /> Base de conocimiento
      </Link>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{a.titulo}</h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{NOMBRE_CATEGORIA[a.categoria]}</span>
        {a.publico ? (
          <Link href={`/portal/ayuda/${a.id}`} className="font-semibold text-primary hover:underline">
            Ver en el portal
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1">
            <EyeOffIcon className="size-3.5" aria-hidden="true" /> Solo técnicos
          </span>
        )}
        <span>
          Escrito por {a.autor}; actualizado el {formatearFechaHora(a.actualizadoEn, ahora)}
        </span>
        {a.utiles + a.noUtiles > 0 && (
          <span>
            Le sirvió a {a.utiles} de {a.utiles + a.noUtiles}
          </span>
        )}
        {a.ticketId && (
          <Link href={`/tickets/${a.ticketId}`} className="text-primary hover:underline">
            Salió del ticket #{a.ticketId}
          </Link>
        )}
      </p>
      <article className="mt-6 rounded-lg border border-border bg-card p-5 sm:p-6">
        <Contenido texto={a.contenido} />
      </article>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href={`/conocimiento/${a.id}/editar`}>
            <PencilIcon /> Editar
          </Link>
        </Button>
        <Eliminar id={a.id} />
      </div>
    </div>
  );
}
