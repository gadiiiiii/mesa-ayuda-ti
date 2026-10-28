import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, like, ne, or, sql, type SQL } from "drizzle-orm";
import type { BD } from "./db";
import { equipos, eventos, reglasAsignacion, tecnicos, tickets, type Equipo, type Evento, type Ticket } from "./db/esquema";
import {
  CATEGORIAS,
  ESTADOS_EQUIPO,
  AUTOR_SISTEMA,
  ESTADOS_PENDIENTES,
  REGLAS_INICIALES,
  elegirTecnico,
  type Regla,
  PREFIJO_TIPO,
  TECNICOS,
  accionPara,
  calcularVencimiento,
  minutosHabiles,
  esTecnico,
  plazo,
  siguienteCodigo,
  type Categoria,
  type Estado,
  type EstadoEquipo,
  type Prioridad,
  type TipoEquipo,
} from "./dominio";
import { nuevoCodigo } from "./codigo";
import type { EquipoDatos, Solicitud, TicketNuevo } from "./validacion";

export type Resultado<T = void> = { ok: true; valor: T } | { ok: false; error: string };
const bien = <T>(valor: T): Resultado<T> => ({ ok: true, valor });
const mal = (error: string): Resultado<never> => ({ ok: false, error });

// ── Tickets ────────────────────────────────────────────────────────────────

export interface FiltrosTickets {
  /** "pendientes" agrupa abierto, en curso y en espera. */
  estado?: "pendientes" | "todos" | Estado;
  prioridad?: Prioridad;
  categoria?: Categoria;
  /** Nombre del técnico, o "sin_asignar". */
  tecnico?: string;
  q?: string;
  equipoId?: number;
}

export type FilaTicket = Pick<
  Ticket,
  | "id"
  | "titulo"
  | "solicitante"
  | "unidad"
  | "categoria"
  | "prioridad"
  | "estado"
  | "tecnico"
  | "creadoEn"
  | "venceEn"
  | "resueltoEn"
  | "pausadoDesde"
> & { equipoCodigo: string | null };

const columnasFila = {
  id: tickets.id,
  titulo: tickets.titulo,
  solicitante: tickets.solicitante,
  unidad: tickets.unidad,
  categoria: tickets.categoria,
  prioridad: tickets.prioridad,
  estado: tickets.estado,
  tecnico: tickets.tecnico,
  creadoEn: tickets.creadoEn,
  venceEn: tickets.venceEn,
  resueltoEn: tickets.resueltoEn,
  pausadoDesde: tickets.pausadoDesde,
  equipoCodigo: equipos.codigo,
};

function condicionesTickets(f: FiltrosTickets): SQL[] {
  const c: SQL[] = [];
  const estado = f.estado ?? "pendientes";
  if (estado === "pendientes") c.push(inArray(tickets.estado, [...ESTADOS_PENDIENTES]));
  else if (estado !== "todos") c.push(eq(tickets.estado, estado));
  if (f.prioridad) c.push(eq(tickets.prioridad, f.prioridad));
  if (f.categoria) c.push(eq(tickets.categoria, f.categoria));
  if (f.tecnico === "sin_asignar") c.push(isNull(tickets.tecnico));
  else if (f.tecnico) c.push(eq(tickets.tecnico, f.tecnico));
  if (f.equipoId) c.push(eq(tickets.equipoId, f.equipoId));
  const q = f.q?.trim();
  if (q) {
    const numero = /^#?(\d+)$/.exec(q);
    const patron = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    const texto = or(
      ilike(tickets.titulo, patron),
      ilike(tickets.descripcion, patron),
      ilike(tickets.solicitante, patron),
      ilike(equipos.codigo, patron),
    )!;
    c.push(numero ? or(eq(tickets.id, Number(numero[1])), texto)! : texto);
  }
  return c;
}

/** Pendientes: primero los que vencen antes. El resto: los más nuevos primero. */
export async function listarTickets(bd: BD, f: FiltrosTickets = {}, limite = 200): Promise<FilaTicket[]> {
  const pendientes = (f.estado ?? "pendientes") === "pendientes";
  return bd
    .select(columnasFila)
    .from(tickets)
    .leftJoin(equipos, eq(tickets.equipoId, equipos.id))
    .where(and(...condicionesTickets(f)))
    .orderBy(...(pendientes ? [asc(tickets.venceEn), asc(tickets.id)] : [desc(tickets.creadoEn), desc(tickets.id)]))
    .limit(limite);
}

export interface DetalleTicket {
  ticket: Ticket;
  equipo: Equipo | null;
  eventos: Evento[];
}

export async function obtenerTicket(bd: BD, id: number): Promise<DetalleTicket | null> {
  const [fila] = await bd.select().from(tickets).leftJoin(equipos, eq(tickets.equipoId, equipos.id)).where(eq(tickets.id, id));
  if (!fila) return null;
  const historial = await bd.select().from(eventos).where(eq(eventos.ticketId, id)).orderBy(asc(eventos.creadoEn), asc(eventos.id));
  return { ticket: fila.tickets, equipo: fila.equipos, eventos: historial };
}

type Transaccion = Parameters<Parameters<BD["transaction"]>[0]>[0];

/** Inserta el ticket con un código de seguimiento libre y su evento de creación. */
async function insertarTicket(
  bd: BD,
  datos: Omit<TicketNuevo, "equipoId"> & { equipoId: number | null; origen: "mesa" | "portal" },
  autor: string,
  ahora: Date,
): Promise<{ id: number; codigo: string }> {
  for (let intento = 0; ; intento++) {
    const codigo = nuevoCodigo();
    try {
      return await bd.transaction(async (tx: Transaccion) => {
        const tecnico = await tecnicoParaNuevo(tx as unknown as BD, datos.categoria);
        const [t] = await tx
          .insert(tickets)
          .values({
            ...datos,
            tecnico,
            codigo,
            creadoEn: ahora,
            actualizadoEn: ahora,
            venceEn: calcularVencimiento(ahora, datos.prioridad),
          })
          .returning({ id: tickets.id });
        await tx.insert(eventos).values({ ticketId: t.id, tipo: "creado", autor, publico: true, creadoEn: ahora });
        if (tecnico) {
          await tx
            .insert(eventos)
            .values({ ticketId: t.id, tipo: "asignacion", autor: AUTOR_SISTEMA, hacia: tecnico, publico: true, creadoEn: ahora });
        }
        return { id: t.id, codigo };
      });
    } catch (err) {
      // Un código repetido es casi imposible (31^8 combinaciones), pero si pasa se elige otro.
      if (intento >= 2 || !String((err as { cause?: unknown })?.cause ?? err).includes("tickets_codigo_unique")) throw err;
    }
  }
}

export async function crearTicket(bd: BD, datos: TicketNuevo, autor: string, ahora: Date): Promise<Resultado<number>> {
  if (datos.equipoId) {
    const [e] = await bd.select({ id: equipos.id }).from(equipos).where(eq(equipos.id, datos.equipoId));
    if (!e) return mal("El equipo elegido ya no existe.");
  }
  const t = await insertarTicket(bd, { ...datos, origen: "mesa" }, autor, ahora);
  return bien(t.id);
}

/** Una solicitud del portal. El equipo se indica por el código de su etiqueta. */
export async function crearSolicitud(bd: BD, datos: Solicitud, ahora: Date): Promise<Resultado<{ id: number; codigo: string }>> {
  let equipoId: number | null = null;
  if (datos.codigoEquipo) {
    const [e] = await bd.select({ id: equipos.id }).from(equipos).where(eq(equipos.codigo, datos.codigoEquipo));
    if (!e) return mal(`No encontramos un equipo con el código ${datos.codigoEquipo}. Revisa la etiqueta o deja el campo vacío.`);
    equipoId = e.id;
  }
  const { codigoEquipo: _codigo, ...resto } = datos;
  return bien(await insertarTicket(bd, { ...resto, equipoId, origen: "portal" }, datos.solicitante, ahora));
}

export async function cambiarEstado(
  bd: BD,
  id: number,
  hacia: Estado,
  nota: string | null,
  autor: string,
  ahora: Date,
): Promise<Resultado> {
  const [t] = await bd.select().from(tickets).where(eq(tickets.id, id));
  if (!t) return mal("El ticket no existe.");
  const accion = accionPara(t.estado, hacia);
  if (!accion) return mal("Ese cambio de estado no es posible desde el estado actual. Recarga la página.");
  if (accion.nota && !nota) return mal(`Falta: ${accion.nota.etiqueta.toLowerCase()}.`);

  await bd.transaction(async (tx) => {
    const cambios: Partial<Ticket> = { estado: hacia, actualizadoEn: ahora };
    if (hacia === "resuelto") cambios.resueltoEn = ahora;
    // En espera el plazo se detiene; al salir, el tiempo hábil detenido alarga el plazo.
    if (hacia === "en_espera") cambios.pausadoDesde = ahora;
    if (t.estado === "en_espera" && t.pausadoDesde) {
      cambios.minutosPausa = t.minutosPausa + minutosHabiles(t.pausadoDesde, ahora);
      cambios.venceEn = calcularVencimiento(t.creadoEn, t.prioridad, cambios.minutosPausa);
      cambios.pausadoDesde = null;
    }
    if (hacia === "abierto" && (t.estado === "resuelto" || t.estado === "cerrado")) cambios.resueltoEn = null;
    // Quien toma un ticket sin técnico queda asignado.
    const asignar = hacia === "en_curso" && !t.tecnico && esTecnico(autor);
    if (asignar) cambios.tecnico = autor;

    await tx.update(tickets).set(cambios).where(eq(tickets.id, id));
    if (asignar) {
      await tx
        .insert(eventos)
        .values({ ticketId: id, tipo: "asignacion", autor, desde: null, hacia: autor, publico: true, creadoEn: ahora });
    }
    await tx.insert(eventos).values({
      ticketId: id,
      tipo: "estado",
      autor,
      desde: t.estado,
      hacia,
      texto: accion.nota ? nota : null,
      publico: true,
      creadoEn: ahora,
    });
  });
  return bien(undefined);
}

/** `publico`: respuesta que el solicitante ve en el portal; si no, nota interna. */
export async function comentar(bd: BD, id: number, texto: string, autor: string, ahora: Date, publico = false): Promise<Resultado> {
  const [t] = await bd.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, id));
  if (!t) return mal("El ticket no existe.");
  await bd.transaction(async (tx) => {
    await tx.insert(eventos).values({ ticketId: id, tipo: "comentario", autor, texto, publico, creadoEn: ahora });
    await tx.update(tickets).set({ actualizadoEn: ahora }).where(eq(tickets.id, id));
  });
  return bien(undefined);
}

/** Cambia el técnico y la prioridad; registra en el historial solo lo que cambió. */
export async function actualizarAsignacion(
  bd: BD,
  id: number,
  datos: { tecnico: string | null; prioridad: Prioridad },
  autor: string,
  ahora: Date,
): Promise<Resultado<{ cambios: number }>> {
  const [t] = await bd.select().from(tickets).where(eq(tickets.id, id));
  if (!t) return mal("El ticket no existe.");
  const nuevos: Partial<Ticket> = {};
  const registro: (typeof eventos.$inferInsert)[] = [];
  if (datos.tecnico !== t.tecnico) {
    nuevos.tecnico = datos.tecnico;
    registro.push({ ticketId: id, tipo: "asignacion", autor, desde: t.tecnico, hacia: datos.tecnico, publico: true, creadoEn: ahora });
  }
  if (datos.prioridad !== t.prioridad) {
    nuevos.prioridad = datos.prioridad;
    // El plazo se recalcula desde la creación: subir la prioridad lo acorta.
    nuevos.venceEn = calcularVencimiento(t.creadoEn, datos.prioridad, t.minutosPausa);
    registro.push({ ticketId: id, tipo: "prioridad", autor, desde: t.prioridad, hacia: datos.prioridad, creadoEn: ahora });
  }
  if (!registro.length) return bien({ cambios: 0 });
  await bd.transaction(async (tx) => {
    await tx
      .update(tickets)
      .set({ ...nuevos, actualizadoEn: ahora })
      .where(eq(tickets.id, id));
    await tx.insert(eventos).values(registro);
  });
  return bien({ cambios: registro.length });
}

// ── Asignación automática y «Mis tickets» ─────────────────────────────────

export async function obtenerReglas(bd: BD): Promise<Record<Categoria, Regla>> {
  const filas = await bd.select().from(reglasAsignacion);
  const r = Object.fromEntries(CATEGORIAS.map((c) => [c, { modo: "cola", tecnico: null } as Regla])) as Record<Categoria, Regla>;
  for (const f of filas) r[f.categoria] = { modo: f.modo, tecnico: f.tecnico };
  return r;
}

/** Técnicos que reciben tickets automáticamente. Si la tabla está vacía, todos. */
export async function tecnicosDisponibles(bd: BD): Promise<string[]> {
  const filas = await bd.select().from(tecnicos);
  if (!filas.length) return [...TECNICOS];
  return TECNICOS.filter((t) => filas.some((f) => f.nombre === t && f.disponible));
}

export async function cargaPendiente(bd: BD): Promise<Map<string, number>> {
  const filas = await bd
    .select({ tecnico: tickets.tecnico, n: count() })
    .from(tickets)
    .where(inArray(tickets.estado, [...ESTADOS_PENDIENTES]))
    .groupBy(tickets.tecnico);
  return new Map(filas.filter((f) => f.tecnico).map((f) => [f.tecnico!, Number(f.n)]));
}

async function tecnicoParaNuevo(bd: BD, categoria: Categoria): Promise<string | null> {
  const [regla] = await bd.select().from(reglasAsignacion).where(eq(reglasAsignacion.categoria, categoria));
  if (!regla || regla.modo === "cola") return null;
  return elegirTecnico(regla, await tecnicosDisponibles(bd), await cargaPendiente(bd));
}

export async function guardarReglas(bd: BD, reglas: Record<Categoria, Regla>, disponibles: readonly string[]): Promise<void> {
  await bd.transaction(async (tx) => {
    for (const c of CATEGORIAS) {
      const r = reglas[c];
      const valor = { modo: r.modo, tecnico: r.modo === "tecnico" ? r.tecnico : null };
      await tx
        .insert(reglasAsignacion)
        .values({ categoria: c, ...valor })
        .onConflictDoUpdate({ target: reglasAsignacion.categoria, set: valor });
    }
    for (const t of TECNICOS) {
      const disponible = disponibles.includes(t);
      await tx.insert(tecnicos).values({ nombre: t, disponible }).onConflictDoUpdate({ target: tecnicos.nombre, set: { disponible } });
    }
  });
}

/** Deja las reglas y la disponibilidad como al comienzo de la demo. */
export async function reglasIniciales(bd: BD): Promise<void> {
  await guardarReglas(bd, REGLAS_INICIALES, TECNICOS);
}

export interface MisTickets {
  asignados: FilaTicket[];
  /** Los que nadie ha tomado, los más urgentes primero. */
  porTomar: FilaTicket[];
  /** Lo que resolvió en los últimos 7 días. */
  resueltos: FilaTicket[];
}

export async function misTickets(bd: BD, tecnico: string, ahora: Date): Promise<MisTickets> {
  const [asignados, porTomar, recientes] = await Promise.all([
    listarTickets(bd, { estado: "pendientes", tecnico }),
    listarTickets(bd, { estado: "pendientes", tecnico: "sin_asignar" }, 5),
    bd
      .select(columnasFila)
      .from(tickets)
      .leftJoin(equipos, eq(tickets.equipoId, equipos.id))
      .where(and(eq(tickets.tecnico, tecnico), gte(tickets.resueltoEn, new Date(ahora.getTime() - 7 * DIA))))
      .orderBy(desc(tickets.resueltoEn))
      .limit(10),
  ]);
  return { asignados, porTomar, resueltos: recientes };
}

export async function contarMisPendientes(bd: BD, tecnico: string): Promise<number> {
  const [r] = await bd
    .select({ n: count() })
    .from(tickets)
    .where(and(eq(tickets.tecnico, tecnico), inArray(tickets.estado, [...ESTADOS_PENDIENTES])));
  return Number(r?.n ?? 0);
}

// ── Portal: lo que ve quien pidió ayuda ────────────────────────────────────

export interface Seguimiento {
  ticket: Ticket;
  equipoCodigo: string | null;
  /** Solo los eventos públicos: nada de notas internas ni cambios de prioridad. */
  eventos: Evento[];
}

export async function obtenerSeguimiento(bd: BD, codigo: string): Promise<Seguimiento | null> {
  const [fila] = await bd
    .select({ ticket: tickets, equipoCodigo: equipos.codigo })
    .from(tickets)
    .leftJoin(equipos, eq(tickets.equipoId, equipos.id))
    .where(eq(tickets.codigo, codigo));
  if (!fila) return null;
  const historial = await bd
    .select()
    .from(eventos)
    .where(and(eq(eventos.ticketId, fila.ticket.id), eq(eventos.publico, true)))
    .orderBy(asc(eventos.creadoEn), asc(eventos.id));
  return { ticket: fila.ticket, equipoCodigo: fila.equipoCodigo, eventos: historial };
}

/**
 * El solicitante agrega información desde el portal. Si el ticket estaba resuelto y marca que
 * el problema sigue, se reabre con su mensaje como motivo.
 */
export async function responderSolicitante(
  bd: BD,
  codigo: string,
  texto: string,
  reabrir: boolean,
  ahora: Date,
): Promise<Resultado<{ reabierto: boolean }>> {
  const [t] = await bd.select().from(tickets).where(eq(tickets.codigo, codigo));
  if (!t) return mal("No encontramos esa solicitud.");
  if (t.estado === "cerrado") return mal("Esta solicitud está cerrada. Si necesitas ayuda de nuevo, crea una solicitud nueva.");
  if (reabrir && t.estado === "resuelto") {
    const r = await cambiarEstado(bd, t.id, "abierto", texto, t.solicitante, ahora);
    return r.ok ? bien({ reabierto: true }) : r;
  }
  const r = await comentar(bd, t.id, texto, t.solicitante, ahora, true);
  return r.ok ? bien({ reabierto: false }) : r;
}

// ── Inventario ─────────────────────────────────────────────────────────────

export interface FiltrosEquipos {
  tipo?: TipoEquipo;
  estado?: EstadoEquipo;
  unidad?: string;
  q?: string;
}

export type FilaEquipo = Pick<Equipo, "id" | "codigo" | "tipo" | "marca" | "modelo" | "unidad" | "responsable" | "estado" | "ip"> & {
  pendientes: number;
};

export async function listarEquipos(bd: BD, f: FiltrosEquipos = {}): Promise<FilaEquipo[]> {
  const c: SQL[] = [];
  if (f.tipo) c.push(eq(equipos.tipo, f.tipo));
  if (f.estado) c.push(eq(equipos.estado, f.estado));
  if (f.unidad) c.push(eq(equipos.unidad, f.unidad));
  const q = f.q?.trim();
  if (q) {
    const patron = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    c.push(
      or(
        ilike(equipos.codigo, patron),
        ilike(equipos.marca, patron),
        ilike(equipos.modelo, patron),
        ilike(equipos.serie, patron),
        ilike(equipos.responsable, patron),
        like(equipos.ip, patron),
      )!,
    );
  }
  const pendientes = bd
    .select({ equipoId: tickets.equipoId, n: count().as("n") })
    .from(tickets)
    .where(inArray(tickets.estado, [...ESTADOS_PENDIENTES]))
    .groupBy(tickets.equipoId)
    .as("pendientes");
  const filas = await bd
    .select({
      id: equipos.id,
      codigo: equipos.codigo,
      tipo: equipos.tipo,
      marca: equipos.marca,
      modelo: equipos.modelo,
      unidad: equipos.unidad,
      responsable: equipos.responsable,
      estado: equipos.estado,
      ip: equipos.ip,
      pendientes: pendientes.n,
    })
    .from(equipos)
    .leftJoin(pendientes, eq(pendientes.equipoId, equipos.id))
    .where(and(...c))
    .orderBy(asc(equipos.codigo));
  return filas.map((f) => ({ ...f, pendientes: Number(f.pendientes ?? 0) }));
}

export async function obtenerEquipo(bd: BD, id: number): Promise<{ equipo: Equipo; tickets: FilaTicket[] } | null> {
  const [equipo] = await bd.select().from(equipos).where(eq(equipos.id, id));
  if (!equipo) return null;
  return { equipo, tickets: await listarTickets(bd, { estado: "todos", equipoId: id }) };
}

/** Equipos que se pueden asociar a un ticket nuevo (todos menos los dados de baja). */
export async function equiposParaElegir(bd: BD) {
  return bd
    .select({
      id: equipos.id,
      codigo: equipos.codigo,
      tipo: equipos.tipo,
      marca: equipos.marca,
      modelo: equipos.modelo,
      unidad: equipos.unidad,
      responsable: equipos.responsable,
    })
    .from(equipos)
    .where(ne(equipos.estado, "de_baja"))
    .orderBy(asc(equipos.unidad), asc(equipos.codigo));
}

export async function crearEquipo(bd: BD, datos: EquipoDatos, ahora: Date): Promise<Resultado<number>> {
  // Dos altas al mismo tiempo podrían elegir el mismo código: el índice único lo impide y se reintenta.
  for (let intento = 0; intento < 3; intento++) {
    const prefijo = PREFIJO_TIPO[datos.tipo];
    const usados = await bd
      .select({ codigo: equipos.codigo })
      .from(equipos)
      .where(like(equipos.codigo, `${prefijo}-%`));
    const codigo = siguienteCodigo(
      datos.tipo,
      usados.map((u) => u.codigo),
    );
    try {
      const [e] = await bd
        .insert(equipos)
        .values({ ...datos, codigo, creadoEn: ahora, actualizadoEn: ahora })
        .returning({ id: equipos.id });
      return bien(e.id);
    } catch (err) {
      if (!String((err as { cause?: unknown })?.cause ?? err).includes("equipos_codigo_unique")) throw err;
    }
  }
  return mal("No se pudo asignar un código de inventario. Intenta de nuevo.");
}

/** El tipo no cambia al editar: el código de inventario depende de él. */
export async function actualizarEquipo(bd: BD, id: number, datos: Omit<EquipoDatos, "tipo">, ahora: Date): Promise<Resultado> {
  const r = await bd
    .update(equipos)
    .set({ ...datos, actualizadoEn: ahora })
    .where(eq(equipos.id, id))
    .returning({ id: equipos.id });
  return r.length ? bien(undefined) : mal("El equipo no existe.");
}

// ── Panel ──────────────────────────────────────────────────────────────────

export interface Resumen {
  pendientes: number;
  vencidos: number;
  porVencer: number;
  sinAsignar: number;
  resueltos7: number;
  /** % de tickets resueltos en los últimos 30 días que se resolvieron dentro del plazo. null si no hay. */
  cumplimiento30: number | null;
  resueltos30: number;
  porCategoria: { categoria: Categoria; n: number }[];
  porTecnico: { tecnico: string | null; n: number }[];
  equiposPorEstado: { estado: EstadoEquipo; n: number }[];
  /** Pendientes vencidos o por vencer, los más urgentes primero. */
  atencion: FilaTicket[];
}

const DIA = 86_400_000;

export async function resumen(bd: BD, ahora: Date): Promise<Resumen> {
  const pendientes = await listarTickets(bd, { estado: "pendientes" }, 10_000);
  const conPlazo = pendientes.map((t) => ({ t, p: plazo(t, ahora) }));

  const resueltos = await bd
    .select({ resueltoEn: tickets.resueltoEn, venceEn: tickets.venceEn })
    .from(tickets)
    .where(gte(tickets.resueltoEn, new Date(ahora.getTime() - 30 * DIA)));
  const dentro = resueltos.filter((r) => r.resueltoEn! <= r.venceEn).length;

  const equiposEstado = await bd.select({ estado: equipos.estado, n: count() }).from(equipos).groupBy(equipos.estado);

  const contar = <K extends string | null>(clave: (t: FilaTicket) => K) => {
    const m = new Map<K, number>();
    for (const t of pendientes) m.set(clave(t), (m.get(clave(t)) ?? 0) + 1);
    return m;
  };
  const cat = contar((t) => t.categoria);
  const tec = contar((t) => t.tecnico);

  return {
    pendientes: pendientes.length,
    vencidos: conPlazo.filter((x) => x.p.estado === "vencido").length,
    porVencer: conPlazo.filter((x) => x.p.estado === "por_vencer").length,
    sinAsignar: pendientes.filter((t) => !t.tecnico).length,
    resueltos7: resueltos.filter((r) => r.resueltoEn!.getTime() >= ahora.getTime() - 7 * DIA).length,
    cumplimiento30: resueltos.length ? Math.round((dentro / resueltos.length) * 100) : null,
    resueltos30: resueltos.length,
    porCategoria: CATEGORIAS.map((c) => ({ categoria: c, n: cat.get(c) ?? 0 }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n),
    porTecnico: [...TECNICOS, null].map((t) => ({ tecnico: t, n: tec.get(t) ?? 0 })),
    equiposPorEstado: ESTADOS_EQUIPO.map((e) => ({ estado: e, n: Number(equiposEstado.find((x) => x.estado === e)?.n ?? 0) })),
    atencion: conPlazo
      .filter((x) => x.p.estado === "vencido" || x.p.estado === "por_vencer")
      .map((x) => x.t)
      .slice(0, 8),
  };
}

/** Borra todo (y reinicia los números de ticket). Lo usa el botón de restablecer la demo. */
export async function vaciar(bd: BD): Promise<void> {
  await bd.execute(sql`TRUNCATE ${eventos}, ${tickets}, ${equipos}, ${reglasAsignacion}, ${tecnicos} RESTART IDENTITY CASCADE`);
}
