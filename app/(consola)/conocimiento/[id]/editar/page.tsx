import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obtenerArticulo } from "@/lib/conocimiento";
import { obtenerBD } from "@/lib/db";
import FormularioArticulo from "../../FormularioArticulo";

export const metadata: Metadata = { title: "Editar artículo" };

export default async function EditarArticulo({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const a = Number.isInteger(id) && id > 0 ? await obtenerArticulo(await obtenerBD(), id) : null;
  if (!a) notFound();
  return (
    <div className="mx-auto max-w-[48rem]">
      <h1 className="text-3xl font-bold">Editar artículo</h1>
      <FormularioArticulo
        id={a.id}
        inicial={{ titulo: a.titulo, categoria: a.categoria, contenido: a.contenido, publico: a.publico ? "on" : "" }}
      />
    </div>
  );
}
