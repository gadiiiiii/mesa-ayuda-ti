import { and, asc, desc, eq, gte, isNotNull, isNull, lte } from "drizzle-orm";
import type { Resultado } from "./datos";
import type { BD } from "./db";
import { equipos, mantenciones, movimientos, type Mantencion, type Movimiento } from "./db/esquema";
import { sumarMeses } from "./fechas";
import { sumarDia } from "./horario";

/**
 * Inventario al estilo de GLPI: garantía de cada equipo, historial de sus cambios
 * (de unidad, de responsable, de estado) y mantenciones preventivas programadas.
 */

const bien = <T>(valor: T): Resultado<T> => ({ ok: true, valor });
const mal = (error: string): Resultado<never> => ({ ok: false, error });

export { diasEntre, estadoGarantia, estadoMantencion, sumarMeses, type EstadoGarantia } from "./fechas";

// ── Historial de cambios ───────────────────────────────────────────────────

/** Campos cuyo cambio queda en el historial del equipo. */
export const CAMPOS_HISTORIAL = ["unidad", "responsable", "estado", "ip"] as const;
export type CampoHistorial = (typeof CAMPOS_HISTORIAL)[number];

export async function listarMovimientos(bd: BD, equipoId: number): Promise<Movimiento[]> {
  return bd.select().from(movimientos).where(eq(movimientos.equipoId, equipoId)).orderBy(desc(movimientos.creadoEn), asc(movimientos.id));
}

// ── Mantenciones ───────────────────────────────────────────────────────────

export { TIPOS_MANTENCION, type EstadoMantencion } from "./dominio";

export type FilaMantencion = Mantencion & { equipoCodigo: string; equipoNombre: string; unidad: string };

const columnas = {
  m: mantenciones,
  codigo: equipos.codigo,
  marca: equipos.marca,
  modelo: equipos.modelo,
  unidad: equipos.unidad,
};
const aFila = (f: { m: Mantencion; codigo: string; marca: string; modelo: string; unidad: string }): FilaMantencion => ({
  ...f.m,
  equipoCodigo: f.codigo,
  equipoNombre: `${f.marca} ${f.modelo}`,
  unidad: f.unidad,
});

export async function mantencionesDeEquipo(bd: BD, equipoId: number): Promise<FilaMantencion[]> {
  const filas = await bd
    .select(columnas)
    .from(mantenciones)
    .innerJoin(equipos, eq(mantenciones.equipoId, equipos.id))
    .where(eq(mantenciones.equipoId, equipoId))
    .orderBy(asc(mantenciones.realizadaEn), desc(mantenciones.programadaPara));
  return filas.map(aFila);
}

/** Pendientes hasta `hasta` (incluye las vencidas) y realizadas desde `realizadasDesde`. */
export async function agendaMantenciones(
  bd: BD,
  hoy: string,
  dias = 30,
): Promise<{ pendientes: FilaMantencion[]; realizadas: FilaMantencion[] }> {
  const [pendientes, realizadas] = await Promise.all([
    bd
      .select(columnas)
      .from(mantenciones)
      .innerJoin(equipos, eq(mantenciones.equipoId, equipos.id))
      .where(and(isNull(mantenciones.realizadaEn), lte(mantenciones.programadaPara, sumarDia(hoy, dias))))
      .orderBy(asc(mantenciones.programadaPara)),
    bd
      .select(columnas)
      .from(mantenciones)
      .innerJoin(equipos, eq(mantenciones.equipoId, equipos.id))
      .where(and(isNotNull(mantenciones.realizadaEn), gte(mantenciones.programadaPara, sumarDia(hoy, -90))))
      .orderBy(desc(mantenciones.realizadaEn))
      .limit(10),
  ]);
  return { pendientes: pendientes.map(aFila), realizadas: realizadas.map(aFila) };
}

export async function contarMantencionesVencidas(bd: BD, hoy: string): Promise<number> {
  const filas = await bd
    .select({ id: mantenciones.id })
    .from(mantenciones)
    .where(and(isNull(mantenciones.realizadaEn), lte(mantenciones.programadaPara, sumarDia(hoy, -1))));
  return filas.length;
}

export async function programarMantencion(
  bd: BD,
  datos: { equipoId: number; tipo: string; programadaPara: string; cadaMeses: number | null },
  autor: string,
  ahora: Date,
): Promise<Resultado<number>> {
  const [e] = await bd.select({ id: equipos.id, estado: equipos.estado }).from(equipos).where(eq(equipos.id, datos.equipoId));
  if (!e) return mal("El equipo no existe.");
  if (e.estado === "de_baja") return mal("No se programan mantenciones para equipos dados de baja.");
  const [m] = await bd
    .insert(mantenciones)
    .values({ ...datos, creadaPor: autor, creadoEn: ahora })
    .returning({ id: mantenciones.id });
  return bien(m.id);
}

/** Marca como realizada; si es periódica, programa la siguiente desde hoy. Devuelve la fecha de la siguiente, si hay. */
export async function realizarMantencion(
  bd: BD,
  id: number,
  nota: string | null,
  autor: string,
  ahora: Date,
  hoy: string,
): Promise<Resultado<{ siguiente: string | null }>> {
  const [m] = await bd.select().from(mantenciones).where(eq(mantenciones.id, id));
  if (!m) return mal("La mantención no existe.");
  if (m.realizadaEn) return mal("Esa mantención ya está registrada como realizada.");
  const siguiente = m.cadaMeses ? sumarMeses(hoy, m.cadaMeses) : null;
  await bd.transaction(async (tx) => {
    await tx.update(mantenciones).set({ realizadaEn: ahora, realizadaPor: autor, nota }).where(eq(mantenciones.id, id));
    if (siguiente) {
      await tx.insert(mantenciones).values({
        equipoId: m.equipoId,
        tipo: m.tipo,
        programadaPara: siguiente,
        cadaMeses: m.cadaMeses,
        creadaPor: autor,
        creadoEn: ahora,
      });
    }
  });
  return bien({ siguiente });
}

export async function eliminarMantencion(bd: BD, id: number): Promise<void> {
  await bd.delete(mantenciones).where(and(eq(mantenciones.id, id), isNull(mantenciones.realizadaEn)));
}
