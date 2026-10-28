import type { Metadata } from "next";
import { equiposParaElegir } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { texto, type Parametros } from "@/app/_componentes/parametros";
import FormularioTicket from "./FormularioTicket";

export const metadata: Metadata = { title: "Nuevo ticket" };

export default async function NuevoTicket({ searchParams }: { searchParams: Promise<Parametros> }) {
  const p = await searchParams;
  const equipos = await equiposParaElegir(await obtenerBD());
  const elegido = equipos.find((e) => String(e.id) === texto(p, "equipo"));
  return (
    <div className="mx-auto max-w-[44rem]">
      <h1 className="text-3xl font-bold">Nuevo ticket</h1>
      <p className="mt-1 text-muted-foreground">Registra lo que te pidieron por teléfono, correo o en persona.</p>
      <FormularioTicket
        equipos={equipos}
        inicial={elegido ? { equipoId: String(elegido.id), unidad: elegido.unidad, solicitante: elegido.responsable ?? "" } : {}}
      />
    </div>
  );
}
