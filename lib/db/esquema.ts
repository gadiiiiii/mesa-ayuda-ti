import { sql } from "drizzle-orm";
import { boolean, date, index, integer, pgTable, serial, text, timestamp, type AnyPgColumn } from "drizzle-orm/pg-core";
import type { Categoria, Estado, EstadoEquipo, ModoAsignacion, Prioridad, TipoEquipo } from "../dominio";

const momento = (nombre: string) => timestamp(nombre, { withTimezone: true, mode: "date" });

export const equipos = pgTable(
  "equipos",
  {
    id: serial("id").primaryKey(),
    codigo: text("codigo").notNull().unique(),
    tipo: text("tipo").$type<TipoEquipo>().notNull(),
    marca: text("marca").notNull(),
    modelo: text("modelo").notNull(),
    serie: text("serie"),
    unidad: text("unidad").notNull(),
    responsable: text("responsable"),
    estado: text("estado").$type<EstadoEquipo>().notNull().default("en_uso"),
    ip: text("ip"),
    mac: text("mac"),
    fechaCompra: date("fecha_compra", { mode: "string" }),
    notas: text("notas"),
    creadoEn: momento("creado_en").notNull().defaultNow(),
    actualizadoEn: momento("actualizado_en").notNull().defaultNow(),
  },
  (t) => [index("equipos_unidad_idx").on(t.unidad)],
);

/**
 * Un problema (en el sentido de ITIL): la causa común de varios tickets, por ejemplo «se cae el
 * switch de Obras». Se investiga y se resuelve una vez, y con él se pueden resolver todos sus tickets.
 */
export const problemas = pgTable("problemas", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  estado: text("estado").$type<"abierto" | "resuelto">().notNull().default("abierto"),
  causa: text("causa"),
  solucion: text("solucion"),
  autor: text("autor").notNull(),
  creadoEn: momento("creado_en").notNull().defaultNow(),
  resueltoEn: momento("resuelto_en"),
});

export const tickets = pgTable(
  "tickets",
  {
    id: serial("id").primaryKey(),
    titulo: text("titulo").notNull(),
    descripcion: text("descripcion").notNull(),
    solicitante: text("solicitante").notNull(),
    unidad: text("unidad").notNull(),
    categoria: text("categoria").$type<Categoria>().notNull(),
    prioridad: text("prioridad").$type<Prioridad>().notNull(),
    estado: text("estado").$type<Estado>().notNull().default("abierto"),
    tecnico: text("tecnico"),
    equipoId: integer("equipo_id").references(() => equipos.id, { onDelete: "set null" }),
    creadoEn: momento("creado_en").notNull().defaultNow(),
    actualizadoEn: momento("actualizado_en").notNull().defaultNow(),
    venceEn: momento("vence_en").notNull(),
    resueltoEn: momento("resuelto_en"),
    /** Desde cuándo está en espera (el plazo no corre); null si no lo está. */
    pausadoDesde: momento("pausado_desde"),
    /** Minutos hábiles que el ticket pasó en espera; alargan el plazo. */
    minutosPausa: integer("minutos_pausa").notNull().default(0),
    /** Por dónde llegó: registrado por un técnico o pedido por el funcionario en el portal. */
    origen: text("origen").$type<"mesa" | "portal">().notNull().default("mesa"),
    /** Código para que el solicitante siga su ticket en el portal sin iniciar sesión (ABCD-2345). */
    codigo: text("codigo").unique(),
    /** Si se cerró por ser el mismo caso que otro ticket. */
    duplicadoDe: integer("duplicado_de").references((): AnyPgColumn => tickets.id, { onDelete: "set null" }),
    problemaId: integer("problema_id").references(() => problemas.id, { onDelete: "set null" }),
  },
  (t) => [index("tickets_estado_idx").on(t.estado), index("tickets_equipo_idx").on(t.equipoId)],
);

export type TipoEvento = "creado" | "comentario" | "estado" | "asignacion" | "prioridad" | "relacion";

/** Historial de un ticket: comentarios y cada cambio de estado, prioridad o técnico. */
export const eventos = pgTable(
  "eventos",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    tipo: text("tipo").$type<TipoEvento>().notNull(),
    autor: text("autor").notNull(),
    texto: text("texto"),
    desde: text("desde"),
    hacia: text("hacia"),
    /** Si el solicitante lo ve en el portal. Los comentarios son notas internas salvo que se marquen. */
    publico: boolean("publico").notNull().default(false),
    creadoEn: momento("creado_en").notNull().defaultNow(),
  },
  (t) => [index("eventos_ticket_idx").on(t.ticketId)],
);

/** Cómo se asigna un ticket nuevo de cada categoría. */
export const reglasAsignacion = pgTable("reglas_asignacion", {
  categoria: text("categoria").$type<Categoria>().primaryKey(),
  modo: text("modo").$type<ModoAsignacion>().notNull().default("cola"),
  /** Solo para el modo "tecnico". */
  tecnico: text("tecnico"),
});

/** Técnicos que reciben tickets automáticamente (se desmarca a quien está de vacaciones o con licencia). */
export const tecnicos = pgTable("tecnicos", {
  nombre: text("nombre").primaryKey(),
  disponible: boolean("disponible").notNull().default(true),
});

/** Base de conocimiento: soluciones escritas una vez para consultarlas o compartirlas. */
export const articulos = pgTable(
  "articulos",
  {
    id: serial("id").primaryKey(),
    titulo: text("titulo").notNull(),
    categoria: text("categoria").$type<Categoria>().notNull(),
    /** Texto con párrafos separados por una línea en blanco; las líneas «1.» o «-» forman listas. */
    contenido: text("contenido").notNull(),
    /** Si aparece en el portal para los funcionarios; si no, solo lo ven los técnicos. */
    publico: boolean("publico").notNull().default(true),
    autor: text("autor").notNull(),
    /** Ticket del que salió, si se escribió a partir de una solución. */
    ticketId: integer("ticket_id").references(() => tickets.id, { onDelete: "set null" }),
    /** Respuestas a «¿Te sirvió?» en el portal. */
    utiles: integer("utiles").notNull().default(0),
    noUtiles: integer("no_utiles").notNull().default(0),
    creadoEn: momento("creado_en").notNull().defaultNow(),
    actualizadoEn: momento("actualizado_en").notNull().defaultNow(),
  },
  (t) => [index("articulos_busqueda_idx").using("gin", sql`to_tsvector('spanish', ${t.titulo} || ' ' || ${t.contenido})`)],
);

/** Respuestas predefinidas para comentar más rápido. Admiten {solicitante}, {tecnico} y {folio}. */
export const respuestas = pgTable("respuestas", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  texto: text("texto").notNull(),
});

export type Equipo = typeof equipos.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Evento = typeof eventos.$inferSelect;
export type Problema = typeof problemas.$inferSelect;
export type Articulo = typeof articulos.$inferSelect;
export type Respuesta = typeof respuestas.$inferSelect;
