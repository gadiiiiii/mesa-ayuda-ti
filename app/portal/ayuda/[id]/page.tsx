import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { obtenerArticulo } from "@/lib/conocimiento";
import { obtenerBD } from "@/lib/db";
import Contenido from "@/app/_componentes/Contenido";
import Votar from "./Votar";

type Props = { params: Promise<{ id: string }> };

async function cargar(idTexto: string) {
  const id = Number(idTexto);
  const a = Number.isInteger(id) && id > 0 ? await obtenerArticulo(await obtenerBD(), id) : null;
  return a?.publico ? a : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await cargar((await params).id);
  return { title: a?.titulo ?? "Artículo no encontrado" };
}

export default async function ArticuloPortal({ params }: Props) {
  const a = await cargar((await params).id);
  if (!a) notFound();
  return (
    <div className="mx-auto max-w-[44rem]">
      <Link
        href="/portal/ayuda"
        className="-my-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeftIcon className="size-4" aria-hidden="true" /> Ayuda
      </Link>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{a.titulo}</h1>
      <article className="mt-6 rounded-lg border border-border bg-card p-5 sm:p-6">
        <Contenido texto={a.contenido} />
      </article>
      <Votar id={a.id} />
    </div>
  );
}
