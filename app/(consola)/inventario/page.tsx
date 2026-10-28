import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listarEquipos, type FiltrosEquipos } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { ESTADOS_EQUIPO, NOMBRE_ESTADO_EQUIPO, NOMBRE_TIPO, TIPOS_EQUIPO, UNIDADES } from "@/lib/dominio";
import Filtros from "@/app/_componentes/Filtros";
import { EstadoEquipoTexto, EtiquetaInventario, Garantia } from "@/app/_componentes/Insignias";
import { aLocal } from "@/lib/horario";
import { contarMantencionesVencidas } from "@/lib/inventario";
import { opcion, texto, type Parametros } from "@/app/_componentes/parametros";

export const metadata: Metadata = { title: "Inventario" };

export default async function PaginaInventario({ searchParams }: { searchParams: Promise<Parametros> }) {
  const p = await searchParams;
  const f: FiltrosEquipos = {
    tipo: opcion(p, "tipo", TIPOS_EQUIPO),
    estado: opcion(p, "estado", ESTADOS_EQUIPO),
    unidad: opcion(p, "unidad", UNIDADES),
    q: texto(p, "q") || undefined,
  };
  const hoy = aLocal(new Date()).fecha;
  const garantia = opcion(p, "garantia", ["por_vencer", "vencida"] as const);
  if (garantia) f.garantia = { estado: garantia, hoy };
  const bd = await obtenerBD();
  const [filas, atrasadas] = await Promise.all([listarEquipos(bd, f), contarMantencionesVencidas(bd, hoy)]);
  const hayFiltros = !!(f.tipo || f.estado || f.unidad || f.q || garantia);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inventario</h1>
          <p className="mt-1 text-muted-foreground">Equipos por código de inventario, con los tickets que tienen abiertos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/inventario/mantenciones"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
          >
            Mantenciones
            {atrasadas > 0 && (
              <span className="ml-1.5 rounded-full bg-destructive-soft px-1.5 text-xs font-bold text-destructive">
                {atrasadas} {atrasadas === 1 ? "atrasada" : "atrasadas"}
              </span>
            )}
          </Link>
          <Button asChild>
            <Link href="/inventario/nuevo">
              <PlusIcon /> Agregar equipo
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Filtros
          accion="/inventario"
          q={f.q ?? ""}
          placeholder="Código, modelo, serie, persona o IP"
          hayFiltros={hayFiltros}
          selects={[
            {
              nombre: "tipo",
              etiqueta: "Tipo",
              valor: f.tipo ?? "",
              opciones: [{ valor: "", texto: "Todos" }, ...TIPOS_EQUIPO.map((t) => ({ valor: t, texto: NOMBRE_TIPO[t] }))],
            },
            {
              nombre: "estado",
              etiqueta: "Estado",
              valor: f.estado ?? "",
              opciones: [{ valor: "", texto: "Todos" }, ...ESTADOS_EQUIPO.map((e) => ({ valor: e, texto: NOMBRE_ESTADO_EQUIPO[e] }))],
            },
            {
              nombre: "garantia",
              etiqueta: "Garantía",
              valor: garantia ?? "",
              opciones: [
                { valor: "", texto: "Todas" },
                { valor: "por_vencer", texto: "Vence en 60 días" },
                { valor: "vencida", texto: "Vencida" },
              ],
            },
            {
              nombre: "unidad",
              etiqueta: "Unidad",
              valor: f.unidad ?? "",
              opciones: [{ valor: "", texto: "Todas" }, ...UNIDADES.map((u) => ({ valor: u, texto: u }))],
            },
          ]}
        />
      </div>

      <p className="mt-6 mb-2 text-sm text-muted-foreground" aria-live="polite">
        {filas.length === 1 ? "1 equipo" : `${filas.length} equipos`}
      </p>
      {filas.length ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full border-collapse text-left">
            <thead className="hidden border-b border-border text-sm text-muted-foreground md:table-header-group">
              <tr>
                <th scope="col" className="py-2.5 pr-3 pl-4 font-semibold">
                  Código
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Equipo
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Unidad y responsable
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  IP
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Estado
                </th>
                <th scope="col" className="py-2.5 pr-4 pl-3 text-right font-semibold">
                  Tickets pendientes
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((e) => (
                <tr
                  key={e.id}
                  className="relative grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-b border-border px-4 py-3 last:border-b-0 hover:bg-primary-soft/40 md:table-row md:p-0"
                >
                  <td className="row-span-2 md:py-3 md:pr-3 md:pl-4">
                    <Link
                      href={`/inventario/${e.id}`}
                      className="outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-primary/40 focus-visible:after:ring-inset"
                      aria-label={`${e.codigo}: ${NOMBRE_TIPO[e.tipo]} ${e.marca} ${e.modelo}`}
                    >
                      <EtiquetaInventario codigo={e.codigo} />
                    </Link>
                  </td>
                  <td className="md:px-3 md:py-3">
                    <span className="font-semibold">
                      {e.marca} {e.modelo}
                    </span>
                    <span className="block text-sm text-muted-foreground">{NOMBRE_TIPO[e.tipo]}</span>
                  </td>
                  <td className="col-start-2 text-sm md:px-3 md:py-3 md:text-base">
                    {e.unidad}
                    {e.responsable && <span className="block text-sm text-muted-foreground">{e.responsable}</span>}
                  </td>
                  <td className="col-start-2 font-mono text-sm md:px-3 md:py-3">
                    {e.ip ?? <span className="font-sans text-muted-foreground md:inline hidden">Sin IP</span>}
                  </td>
                  <td className="col-start-2 text-sm md:px-3 md:py-3 md:text-base">
                    <EstadoEquipoTexto estado={e.estado} />
                    {e.estado !== "de_baja" && (
                      <span className="block text-sm">
                        <Garantia hasta={e.garantiaHasta} hoy={hoy} corta />
                      </span>
                    )}
                  </td>
                  <td className="col-start-2 text-sm md:py-3 md:pr-4 md:pl-3 md:text-right md:text-base">
                    {e.pendientes ? (
                      <span className="font-semibold">
                        {e.pendientes} <span className="md:hidden">{e.pendientes === 1 ? "ticket pendiente" : "tickets pendientes"}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground md:inline hidden">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="font-semibold">Ningún equipo coincide con estos filtros.</p>
          <p className="mt-1">
            <Link href="/inventario" className="font-semibold text-primary hover:underline">
              Ver todo el inventario
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
