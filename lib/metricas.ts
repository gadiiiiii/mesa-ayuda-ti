import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import type { Resultado } from "./datos";
import type { BD } from "./db";
import { encuestas, eventos, tickets, type Encuesta, type Evento, type Ticket } from "./db/esquema";
import { AUTOR_SISTEMA, CATEGORIAS, NOMBRE_CATEGORIA, NOMBRE_ESTADO, NOMBRE_PRIORIDAD, TECNICOS, type Categoria } from "./dominio";
import { aLocal, habilesEntre, sumarDia } from "./horario";

/**
 * Métricas de la mesa de ayuda, como los reportes de ServiceNow o Freshservice:
 * tiempos en horas hábiles (sin contar el tiempo en espera), cumplimiento de plazos y satisfacción.
 */

const H = 3_600_000;
const bien = <T>(valor: T): Resultado<T> => ({ ok: true, valor });
const mal = (error: string): Resultado<never> => ({ ok: false, error });

export interface DatosMetricas {
  tickets: Ticket[];
  eventos: Evento[];
  encuestas: Encuesta[];
}

export interface Fila {
  recibidos: number;
  resueltos: number;
  /** % resueltos dentro del plazo (null si no hay resueltos). */
  enPlazo: number | null;
  /** Horas hábiles promedio hasta resolver, sin el tiempo en espera. */
  horasResolucion: number | null;
  /** Horas hábiles promedio hasta que un técnico lo atiende por primera vez. */
  horasPrimeraRespuesta: number | null;
  /** Promedio de la encuesta (1 a 5) y cantidad de respuestas. */
  satisfaccion: number | null;
  encuestas: number;
}

export interface Metricas {
  desde: Date;
  hasta: Date;
  total: Fila & { satisfechos: number | null };
  porCategoria: ({ categoria: Categoria } & Fila)[];
  porTecnico: ({ tecnico: string } & Fila)[];
  /** Semanas (lunes a domingo) del período, con lo recibido y resuelto en cada una. */
  porSemana: { inicio: string; recibidos: number; resueltos: number }[];
  /** Los comentarios más recientes de la encuesta. */
  comentarios: { ticketId: number; nota: number; comentario: string; creadoEn: Date }[];
}

const promedio = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const redondear = (x: number | null, d = 1) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);

/** Horas hábiles desde la creación hasta la resolución, descontando el tiempo en espera. */
export function horasHabilesResolucion(t: Pick<Ticket, "creadoEn" | "resueltoEn" | "minutosPausa">): number | null {
  if (!t.resueltoEn) return null;
  return Math.max(0, habilesEntre(t.creadoEn, t.resueltoEn) - t.minutosPausa * 60_000) / H;
}

/** Primera vez que un técnico hace algo visible: tomarlo, cambiarle el estado o responderle al solicitante. */
export function primeraRespuesta(t: Pick<Ticket, "solicitante">, evs: Evento[]): Date | null {
  const e = evs.find(
    (e) => e.autor !== t.solicitante && e.autor !== AUTOR_SISTEMA && (e.tipo === "estado" || (e.tipo === "comentario" && e.publico)),
  );
  return e?.creadoEn ?? null;
}

function fila(ts: Ticket[], evsPorTicket: Map<number, Evento[]>, encPorTicket: Map<number, Encuesta>, desde: Date, hasta: Date): Fila {
  const recibidos = ts.filter((t) => t.creadoEn >= desde && t.creadoEn < hasta);
  const resueltos = ts.filter((t) => t.resueltoEn && t.resueltoEn >= desde && t.resueltoEn < hasta);
  const primeras = recibidos
    .map((t) => {
      const p = primeraRespuesta(t, evsPorTicket.get(t.id) ?? []);
      return p ? habilesEntre(t.creadoEn, p) / H : null;
    })
    .filter((x): x is number => x !== null);
  const notas = resueltos.map((t) => encPorTicket.get(t.id)?.nota).filter((x): x is number => x !== undefined);
  return {
    recibidos: recibidos.length,
    resueltos: resueltos.length,
    enPlazo: resueltos.length ? Math.round((resueltos.filter((t) => t.resueltoEn! <= t.venceEn).length / resueltos.length) * 100) : null,
    horasResolucion: redondear(promedio(resueltos.map((t) => horasHabilesResolucion(t)!))),
    horasPrimeraRespuesta: redondear(promedio(primeras)),
    satisfaccion: redondear(promedio(notas)),
    encuestas: notas.length,
  };
}

/** Lunes (en Chile) de la semana de `d`, como AAAA-MM-DD. */
function lunesDe(d: Date): string {
  const f = aLocal(d).fecha;
  const [a, m, dia] = f.split("-").map(Number);
  const semana = new Date(Date.UTC(a, m - 1, dia)).getUTCDay();
  return sumarDia(f, -((semana + 6) % 7));
}

export function calcularMetricas(datos: DatosMetricas, desde: Date, hasta: Date): Metricas {
  const evsPorTicket = new Map<number, Evento[]>();
  for (const e of datos.eventos) {
    const l = evsPorTicket.get(e.ticketId) ?? [];
    l.push(e);
    evsPorTicket.set(e.ticketId, l);
  }
  const encPorTicket = new Map(datos.encuestas.map((e) => [e.ticketId, e]));
  const ts = datos.tickets;
  const total = fila(ts, evsPorTicket, encPorTicket, desde, hasta);
  const notas = ts
    .filter((t) => t.resueltoEn && t.resueltoEn >= desde && t.resueltoEn < hasta)
    .map((t) => encPorTicket.get(t.id)?.nota)
    .filter((x): x is number => x !== undefined);

  const semanas: Metricas["porSemana"] = [];
  for (let s = lunesDe(desde); s <= aLocal(new Date(hasta.getTime() - 1)).fecha; s = sumarDia(s, 7)) {
    semanas.push({ inicio: s, recibidos: 0, resueltos: 0 });
  }
  const semana = (d: Date) => semanas.find((x) => x.inicio === lunesDe(d));
  for (const t of ts) {
    if (t.creadoEn >= desde && t.creadoEn < hasta) semana(t.creadoEn)!.recibidos++;
    if (t.resueltoEn && t.resueltoEn >= desde && t.resueltoEn < hasta) semana(t.resueltoEn)!.resueltos++;
  }

  return {
    desde,
    hasta,
    total: { ...total, satisfechos: notas.length ? Math.round((notas.filter((n) => n >= 4).length / notas.length) * 100) : null },
    porCategoria: CATEGORIAS.map((c) => ({
      categoria: c,
      ...fila(
        ts.filter((t) => t.categoria === c),
        evsPorTicket,
        encPorTicket,
        desde,
        hasta,
      ),
    })).filter((f) => f.recibidos || f.resueltos),
    porTecnico: TECNICOS.map((tec) => ({
      tecnico: tec,
      ...fila(
        ts.filter((t) => t.tecnico === tec),
        evsPorTicket,
        encPorTicket,
        desde,
        hasta,
      ),
    })),
    porSemana: semanas,
    comentarios: datos.encuestas
      .filter((e) => e.comentario && e.creadoEn >= desde && e.creadoEn < hasta)
      .sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime())
      .slice(0, 5)
      .map((e) => ({ ticketId: e.ticketId, nota: e.nota, comentario: e.comentario!, creadoEn: e.creadoEn })),
  };
}

/** Los tickets que tocan el período (creados o resueltos en él), con sus eventos y encuestas. */
export async function cargarDatos(bd: BD, desde: Date, hasta: Date): Promise<DatosMetricas> {
  const creados = await bd
    .select()
    .from(tickets)
    .where(and(gte(tickets.creadoEn, desde), lt(tickets.creadoEn, hasta)));
  const resueltos = await bd
    .select()
    .from(tickets)
    .where(and(gte(tickets.resueltoEn, desde), lt(tickets.resueltoEn, hasta)));
  const porId = new Map([...creados, ...resueltos].map((t) => [t.id, t]));
  const ids = [...porId.keys()];
  if (!ids.length) return { tickets: [], eventos: [], encuestas: [] };
  const [evs, encs] = await Promise.all([
    bd.select().from(eventos).where(inArray(eventos.ticketId, ids)).orderBy(asc(eventos.creadoEn), asc(eventos.id)),
    bd.select().from(encuestas).where(inArray(encuestas.ticketId, ids)),
  ]);
  return { tickets: [...porId.values()], eventos: evs, encuestas: encs };
}

export async function metricas(bd: BD, dias: number, ahora: Date): Promise<Metricas> {
  const desde = new Date(ahora.getTime() - dias * 86_400_000);
  return calcularMetricas(await cargarDatos(bd, desde, ahora), desde, ahora);
}

// ── Encuesta ───────────────────────────────────────────────────────────────

export async function obtenerEncuesta(bd: BD, ticketId: number): Promise<Encuesta | null> {
  const [e] = await bd.select().from(encuestas).where(eq(encuestas.ticketId, ticketId));
  return e ?? null;
}

/** Una sola vez por ticket, y solo si se resolvió. */
export async function responderEncuesta(
  bd: BD,
  ticketId: number,
  nota: number,
  comentario: string | null,
  ahora: Date,
): Promise<Resultado> {
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) return mal("Elige una nota del 1 al 5.");
  const [t] = await bd.select().from(tickets).where(eq(tickets.id, ticketId));
  if (!t) return mal("No encontramos esa solicitud.");
  if (!t.resueltoEn) return mal("La encuesta se responde cuando la solicitud está resuelta.");
  const r = await bd.insert(encuestas).values({ ticketId, nota, comentario, creadoEn: ahora }).onConflictDoNothing().returning();
  return r.length ? bien(undefined) : mal("Esta encuesta ya fue respondida. ¡Gracias!");
}

// ── Exportar ───────────────────────────────────────────────────────────────

/** CSV para Excel en Chile: separado por punto y coma, decimales con coma y BOM para que reconozca los tildes. */
export function aCSV(datos: DatosMetricas): string {
  const enc = new Map(datos.encuestas.map((e) => [e.ticketId, e]));
  const fecha = (d: Date | null) => {
    if (!d) return "";
    const l = aLocal(d);
    const min = Math.floor(l.ms / 60_000);
    return `${l.fecha} ${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  };
  const celda = (x: string | number | null) => {
    const s = x === null ? "" : typeof x === "number" ? String(x).replace(".", ",") : x;
    return /[;"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const columnas = [
    "Folio",
    "Título",
    "Categoría",
    "Prioridad",
    "Estado",
    "Técnico",
    "Solicitante",
    "Unidad",
    "Origen",
    "Creado",
    "Vence",
    "Resuelto",
    "Horas hábiles para resolver",
    "Dentro del plazo",
    "Encuesta (1 a 5)",
  ];
  const filas = [...datos.tickets]
    .sort((a, b) => a.id - b.id)
    .map((t) => {
      const h = horasHabilesResolucion(t);
      return [
        t.id,
        t.titulo,
        NOMBRE_CATEGORIA[t.categoria],
        NOMBRE_PRIORIDAD[t.prioridad],
        NOMBRE_ESTADO[t.estado],
        t.tecnico ?? "",
        t.solicitante,
        t.unidad,
        t.origen === "portal" ? "Portal" : "Mesa de ayuda",
        fecha(t.creadoEn),
        fecha(t.venceEn),
        fecha(t.resueltoEn),
        h === null ? null : Math.round(h * 10) / 10,
        t.resueltoEn ? (t.resueltoEn <= t.venceEn ? "Sí" : "No") : "",
        enc.get(t.id)?.nota ?? null,
      ];
    });
  return "﻿" + [columnas, ...filas].map((f) => f.map(celda).join(";")).join("\r\n") + "\r\n";
}
