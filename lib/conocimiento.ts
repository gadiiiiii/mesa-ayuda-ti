import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { Resultado } from "./datos";
import type { BD } from "./db";
import { articulos, respuestas, type Articulo, type Respuesta } from "./db/esquema";
import type { Categoria } from "./dominio";

/**
 * Base de conocimiento y respuestas predefinidas. La búsqueda usa el texto completo de Postgres
 * en español (reconoce «impresora» al buscar «impresoras») y ordena por relevancia.
 */

const bien = <T>(valor: T): Resultado<T> => ({ ok: true, valor });
const mal = (error: string): Resultado<never> => ({ ok: false, error });

const vector = sql`to_tsvector('spanish', ${articulos.titulo} || ' ' || ${articulos.contenido})`;
/** Cualquiera de las palabras (OR), para que una frase larga igual encuentre artículos parecidos. */
const consulta = (q: string) => sql`replace(plainto_tsquery('spanish', ${q})::text, '&', '|')::tsquery`;

export interface FiltrosArticulos {
  q?: string;
  categoria?: Categoria;
  /** En el portal solo se ven los públicos. */
  soloPublicos?: boolean;
}

export type FilaArticulo = Pick<Articulo, "id" | "titulo" | "categoria" | "publico" | "utiles" | "noUtiles" | "actualizadoEn"> & {
  extracto: string;
};

export async function buscarArticulos(bd: BD, f: FiltrosArticulos = {}, limite = 50): Promise<FilaArticulo[]> {
  const c: SQL[] = [];
  if (f.soloPublicos) c.push(eq(articulos.publico, true));
  if (f.categoria) c.push(eq(articulos.categoria, f.categoria));
  const q = f.q?.trim();
  if (q) {
    const patron = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    c.push(or(sql`${vector} @@ ${consulta(q)}`, ilike(articulos.titulo, patron))!);
  }
  return bd
    .select({
      id: articulos.id,
      titulo: articulos.titulo,
      categoria: articulos.categoria,
      publico: articulos.publico,
      utiles: articulos.utiles,
      noUtiles: articulos.noUtiles,
      actualizadoEn: articulos.actualizadoEn,
      extracto: sql<string>`left(${articulos.contenido}, 160)`,
    })
    .from(articulos)
    .where(and(...c))
    .orderBy(...(q ? [desc(sql`ts_rank(${vector}, ${consulta(q)})`), desc(articulos.utiles)] : [asc(articulos.titulo)]))
    .limit(limite);
}

export async function obtenerArticulo(bd: BD, id: number): Promise<Articulo | null> {
  const [a] = await bd.select().from(articulos).where(eq(articulos.id, id));
  return a ?? null;
}

export interface DatosArticulo {
  titulo: string;
  categoria: Categoria;
  contenido: string;
  publico: boolean;
  ticketId: number | null;
}

export async function crearArticulo(bd: BD, datos: DatosArticulo, autor: string, ahora: Date): Promise<number> {
  const [a] = await bd
    .insert(articulos)
    .values({ ...datos, autor, creadoEn: ahora, actualizadoEn: ahora })
    .returning({ id: articulos.id });
  return a.id;
}

export async function actualizarArticulo(bd: BD, id: number, datos: Omit<DatosArticulo, "ticketId">, ahora: Date): Promise<Resultado> {
  const r = await bd
    .update(articulos)
    .set({ ...datos, actualizadoEn: ahora })
    .where(eq(articulos.id, id))
    .returning({ id: articulos.id });
  return r.length ? bien(undefined) : mal("El artículo no existe.");
}

export async function eliminarArticulo(bd: BD, id: number): Promise<void> {
  await bd.delete(articulos).where(eq(articulos.id, id));
}

/** «¿Te sirvió?» desde el portal. Solo para artículos públicos. */
export async function votarArticulo(bd: BD, id: number, util: boolean): Promise<Resultado> {
  const r = await bd
    .update(articulos)
    .set(util ? { utiles: sql`${articulos.utiles} + 1` } : { noUtiles: sql`${articulos.noUtiles} + 1` })
    .where(and(eq(articulos.id, id), eq(articulos.publico, true)))
    .returning({ id: articulos.id });
  return r.length ? bien(undefined) : mal("El artículo no existe.");
}

// ── Respuestas predefinidas ────────────────────────────────────────────────

export async function listarRespuestas(bd: BD): Promise<Respuesta[]> {
  return bd.select().from(respuestas).orderBy(asc(respuestas.titulo));
}

export async function guardarRespuesta(bd: BD, datos: { id: number | null; titulo: string; texto: string }): Promise<number> {
  if (datos.id) {
    await bd.update(respuestas).set({ titulo: datos.titulo, texto: datos.texto }).where(eq(respuestas.id, datos.id));
    return datos.id;
  }
  const [r] = await bd.insert(respuestas).values({ titulo: datos.titulo, texto: datos.texto }).returning({ id: respuestas.id });
  return r.id;
}

export async function eliminarRespuesta(bd: BD, id: number): Promise<void> {
  await bd.delete(respuestas).where(eq(respuestas.id, id));
}

/** Reemplaza {solicitante}, {tecnico} y {folio}; lo que no se reconoce queda como está. */
export function aplicarPlantilla(texto: string, valores: { solicitante: string; tecnico: string; folio: number }): string {
  const primerNombre = (s: string) => s.trim().split(/\s+/)[0] ?? s;
  return texto
    .replaceAll("{solicitante}", primerNombre(valores.solicitante))
    .replaceAll("{tecnico}", valores.tecnico)
    .replaceAll("{folio}", `#${valores.folio}`);
}

// ── Texto de los artículos ─────────────────────────────────────────────────

export type Bloque = { tipo: "parrafo"; texto: string } | { tipo: "numerada" | "vinetas"; items: string[] };

/** Párrafos separados por una línea en blanco; si todas las líneas empiezan con «1.» o «-», es una lista. */
export function bloques(contenido: string): Bloque[] {
  return contenido
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b): Bloque => {
      const lineas = b.split("\n").map((l) => l.trim());
      if (lineas.every((l) => /^\d+[.)]\s+/.test(l))) return { tipo: "numerada", items: lineas.map((l) => l.replace(/^\d+[.)]\s+/, "")) };
      if (lineas.every((l) => /^[-•*]\s+/.test(l))) return { tipo: "vinetas", items: lineas.map((l) => l.replace(/^[-•*]\s+/, "")) };
      return { tipo: "parrafo", texto: lineas.join(" ") };
    });
}
