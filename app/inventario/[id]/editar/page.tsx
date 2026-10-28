import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obtenerEquipo } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { EtiquetaInventario } from "../../../_componentes/Insignias";
import FormularioEquipo from "../../FormularioEquipo";

export const metadata: Metadata = { title: "Editar equipo" };

export default async function EditarEquipo({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const d = Number.isInteger(id) && id > 0 ? await obtenerEquipo(await obtenerBD(), id) : null;
  if (!d) notFound();
  const e = d.equipo;
  const inicial = Object.fromEntries(
    Object.entries({
      tipo: e.tipo,
      marca: e.marca,
      modelo: e.modelo,
      serie: e.serie,
      unidad: e.unidad,
      responsable: e.responsable,
      estado: e.estado,
      ip: e.ip,
      mac: e.mac,
      fechaCompra: e.fechaCompra,
      notas: e.notas,
    }).map(([k, x]) => [k, x ?? ""]),
  );
  return (
    <div className="mx-auto max-w-[44rem]">
      <EtiquetaInventario codigo={e.codigo} className="text-base" />
      <h1 className="mt-2 text-3xl font-bold">Editar equipo</h1>
      <FormularioEquipo id={e.id} codigo={e.codigo} inicial={inicial} />
    </div>
  );
}
