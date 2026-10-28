import type { Metadata } from "next";
import FormularioEquipo from "../FormularioEquipo";

export const metadata: Metadata = { title: "Agregar equipo" };

export default function NuevoEquipo() {
  return (
    <div className="mx-auto max-w-[44rem]">
      <h1 className="text-3xl font-bold">Agregar equipo</h1>
      <p className="mt-1 text-muted-foreground">Al guardar se le asigna el siguiente código de inventario de su tipo.</p>
      <FormularioEquipo inicial={{}} />
    </div>
  );
}
