import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { cambiarEstado, listarTickets, type FilaTicket, type Resultado } from "./datos";
import type { BD } from "./db";
import { eventos, problemas, tickets, type Problema } from "./db/esquema";
import { ESTADOS_PENDIENTES, estaPendiente } from "./dominio";

/**
 * Tickets relacionados, como en ITIL: un ticket puede ser el **duplicado** de otro (se cierra y
 * se atiende en el original) o formar parte de un **problema**, la causa común de varios tickets,
 * que se resuelve una vez para todos.
 */

const bien = <T>(valor: T): Resultado<T> => ({ ok: true, valor });
const mal = (error: string): Resultado<never> => ({ ok: false, error });

// ── Duplicados ─────────────────────────────────────────────────────────────

/** Cierra `id` como duplicado de `deId`. Si `deId` ya era duplicado de otro, apunta al original. */
export async function marcarDuplicado(bd: BD, id: number, deId: number, autor: string, ahora: Date): Promise<Resultado<number>> {
  if (id === deId) return mal("Un ticket no puede ser duplicado de sí mismo.");
  const [t] = await bd.select().from(tickets).where(eq(tickets.id, id));
  if (!t) return mal("El ticket no existe.");
  if (!estaPendiente(t.estado)) return mal("Solo un ticket pendiente se puede cerrar como duplicado.");
  let [original] = await bd.select().from(tickets).where(eq(tickets.id, deId));
  if (!original) return mal(`No existe el ticket #${deId}.`);
  // Seguir la cadena hasta el original (A duplicado de B, B duplicado de C → A apunta a C).
  for (let i = 0; i < 10 && original.duplicadoDe; i++) {
    [original] = await bd.select().from(tickets).where(eq(tickets.id, original.duplicadoDe));
  }
  if (original.id === id) return mal("Ese ticket ya es duplicado de este.");

  await bd.transaction(async (tx) => {
    await tx
      .update(tickets)
      .set({ estado: "cerrado", duplicadoDe: original.id, pausadoDesde: null, actualizadoEn: ahora })
      .where(eq(tickets.id, id));
    await tx.insert(eventos).values([
      {
        ticketId: id,
        tipo: "estado",
        autor,
        desde: t.estado,
        hacia: "cerrado",
        texto: `Es el mismo caso que el ticket #${original.id}; se atiende allí.`,
        publico: true,
        creadoEn: ahora,
      },
      { ticketId: original.id, tipo: "relacion", autor, texto: `Cerró el ticket #${id} como duplicado de este.`, creadoEn: ahora },
    ]);
  });
  return bien(original.id);
}

export async function duplicadosDe(bd: BD, id: number): Promise<{ id: number; titulo: string; solicitante: string }[]> {
  return bd
    .select({ id: tickets.id, titulo: tickets.titulo, solicitante: tickets.solicitante })
    .from(tickets)
    .where(eq(tickets.duplicadoDe, id))
    .orderBy(asc(tickets.id));
}

// ── Problemas ──────────────────────────────────────────────────────────────

export interface FilaProblema extends Problema {
  total: number;
  pendientes: number;
}

export async function listarProblemas(bd: BD, soloAbiertos = false): Promise<FilaProblema[]> {
  const conteo = bd
    .select({
      problemaId: tickets.problemaId,
      total: count().as("total"),
      pendientes: sql<number>`count(*) filter (where ${inArray(tickets.estado, [...ESTADOS_PENDIENTES])})`.as("pendientes"),
    })
    .from(tickets)
    .groupBy(tickets.problemaId)
    .as("conteo");
  const filas = await bd
    .select({ p: problemas, total: conteo.total, pendientes: conteo.pendientes })
    .from(problemas)
    .leftJoin(conteo, eq(conteo.problemaId, problemas.id))
    .where(soloAbiertos ? eq(problemas.estado, "abierto") : undefined)
    .orderBy(asc(problemas.estado), desc(problemas.creadoEn));
  return filas.map((f) => ({ ...f.p, total: Number(f.total ?? 0), pendientes: Number(f.pendientes ?? 0) }));
}

export async function obtenerProblema(bd: BD, id: number): Promise<{ problema: Problema; tickets: FilaTicket[] } | null> {
  const [problema] = await bd.select().from(problemas).where(eq(problemas.id, id));
  if (!problema) return null;
  return { problema, tickets: await listarTickets(bd, { estado: "todos", problemaId: id }) };
}

export async function crearProblema(
  bd: BD,
  datos: { titulo: string; descripcion: string | null },
  autor: string,
  ahora: Date,
  ticketId?: number,
): Promise<Resultado<number>> {
  const [p] = await bd
    .insert(problemas)
    .values({ ...datos, autor, creadoEn: ahora })
    .returning({ id: problemas.id });
  if (ticketId) {
    const r = await vincularProblema(bd, ticketId, p.id, autor, ahora);
    if (!r.ok) return r;
  }
  return bien(p.id);
}

/** Vincula el ticket a un problema, o lo desvincula con `problemaId` null. */
export async function vincularProblema(
  bd: BD,
  ticketId: number,
  problemaId: number | null,
  autor: string,
  ahora: Date,
): Promise<Resultado> {
  const [t] = await bd.select().from(tickets).where(eq(tickets.id, ticketId));
  if (!t) return mal(`No existe el ticket #${ticketId}.`);
  if (t.problemaId === problemaId) return bien(undefined);
  let titulo = "";
  if (problemaId) {
    const [p] = await bd.select().from(problemas).where(eq(problemas.id, problemaId));
    if (!p) return mal("El problema no existe.");
    if (p.estado === "resuelto") return mal("Ese problema ya está resuelto.");
    titulo = p.titulo;
  }
  await bd.transaction(async (tx) => {
    await tx.update(tickets).set({ problemaId, actualizadoEn: ahora }).where(eq(tickets.id, ticketId));
    await tx.insert(eventos).values({
      ticketId,
      tipo: "relacion",
      autor,
      texto: problemaId ? `Lo vinculó al problema #${problemaId}: ${titulo}` : `Lo quitó del problema #${t.problemaId}`,
      creadoEn: ahora,
    });
  });
  return bien(undefined);
}

/**
 * Resuelve el problema con su causa y solución. Con `resolverTickets`, además resuelve cada ticket
 * pendiente vinculado con esa solución (queda en el historial de cada uno y lo ve su solicitante).
 */
export async function resolverProblema(
  bd: BD,
  id: number,
  datos: { causa: string; solucion: string; resolverTickets: boolean },
  autor: string,
  ahora: Date,
): Promise<Resultado<{ ticketsResueltos: number }>> {
  const [p] = await bd.select().from(problemas).where(eq(problemas.id, id));
  if (!p) return mal("El problema no existe.");
  if (p.estado === "resuelto") return mal("El problema ya estaba resuelto.");
  await bd
    .update(problemas)
    .set({ estado: "resuelto", causa: datos.causa, solucion: datos.solucion, resueltoEn: ahora })
    .where(eq(problemas.id, id));
  let ticketsResueltos = 0;
  if (datos.resolverTickets) {
    const pendientes = await bd
      .select({ id: tickets.id })
      .from(tickets)
      .where(and(eq(tickets.problemaId, id), inArray(tickets.estado, [...ESTADOS_PENDIENTES])));
    for (const t of pendientes) {
      const r = await cambiarEstado(bd, t.id, "resuelto", datos.solucion, autor, ahora);
      if (r.ok) ticketsResueltos++;
    }
  }
  return bien({ ticketsResueltos });
}
