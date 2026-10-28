import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { listarRespuestas } from "@/lib/conocimiento";
import { obtenerBD } from "@/lib/db";
import EditorRespuesta from "./EditorRespuesta";

export const metadata: Metadata = { title: "Respuestas predefinidas" };

export default async function Respuestas() {
  const lista = await listarRespuestas(await obtenerBD());
  return (
    <div className="mx-auto max-w-[48rem]">
      <Link
        href="/conocimiento"
        className="-my-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeftIcon className="size-4" aria-hidden="true" /> Base de conocimiento
      </Link>
      <h1 className="mt-3 text-3xl font-bold">Respuestas predefinidas</h1>
      <p className="mt-1 max-w-[65ch] text-muted-foreground">
        Textos que se insertan al comentar un ticket. Puedes usar <code className="font-mono text-sm">{"{solicitante}"}</code> (su nombre),{" "}
        <code className="font-mono text-sm">{"{tecnico}"}</code> (tu nombre) y <code className="font-mono text-sm">{"{folio}"}</code> (el
        número del ticket).
      </p>
      <ul className="mt-6 flex flex-col gap-4">
        {lista.map((r) => (
          <li key={r.id}>
            <EditorRespuesta respuesta={r} />
          </li>
        ))}
      </ul>
      <section aria-labelledby="titulo-nueva" className="mt-8">
        <h2 id="titulo-nueva" className="text-lg font-bold">
          Nueva respuesta
        </h2>
        <EditorRespuesta />
      </section>
    </div>
  );
}
