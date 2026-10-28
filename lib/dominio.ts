import { habilesEntre, sumarHabiles } from "./horario";

/**
 * Reglas de la mesa de ayuda: estados de un ticket y cómo se pasa de uno a otro,
 * plazos por prioridad e inventario. No depende de la base de datos.
 */

// ── Tickets ────────────────────────────────────────────────────────────────

export const ESTADOS = ["abierto", "en_curso", "en_espera", "resuelto", "cerrado"] as const;
export type Estado = (typeof ESTADOS)[number];

export const NOMBRE_ESTADO: Record<Estado, string> = {
  abierto: "Abierto",
  en_curso: "En curso",
  en_espera: "En espera",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

/** Estados en que el ticket todavía necesita trabajo. */
export const ESTADOS_PENDIENTES: readonly Estado[] = ["abierto", "en_curso", "en_espera"];
export const estaPendiente = (e: Estado) => ESTADOS_PENDIENTES.includes(e);

export interface Accion {
  hacia: Estado;
  /** Texto del botón. */
  etiqueta: string;
  /** Si hay que escribir una nota (la solución, el motivo de la espera…). */
  nota: null | { etiqueta: string; ayuda: string };
}

const NOTA_SOLUCION = { etiqueta: "Solución", ayuda: "Qué se hizo para resolverlo. El solicitante la va a leer." };
const NOTA_ESPERA = { etiqueta: "Qué se espera", ayuda: "Por ejemplo: un repuesto, una respuesta del proveedor o del solicitante." };
const NOTA_CIERRE = { etiqueta: "Motivo del cierre", ayuda: "Por ejemplo: duplicado, no corresponde a TI o el solicitante lo retiró." };
const NOTA_REAPERTURA = { etiqueta: "Motivo", ayuda: "Por qué se vuelve a abrir." };

/** Qué se puede hacer con un ticket según su estado, en el orden en que se muestran los botones. */
export const ACCIONES: Record<Estado, Accion[]> = {
  abierto: [
    { hacia: "en_curso", etiqueta: "Tomar ticket", nota: null },
    { hacia: "resuelto", etiqueta: "Resolver", nota: NOTA_SOLUCION },
    { hacia: "en_espera", etiqueta: "Poner en espera", nota: NOTA_ESPERA },
    { hacia: "cerrado", etiqueta: "Cerrar sin resolver", nota: NOTA_CIERRE },
  ],
  en_curso: [
    { hacia: "resuelto", etiqueta: "Resolver", nota: NOTA_SOLUCION },
    { hacia: "en_espera", etiqueta: "Poner en espera", nota: NOTA_ESPERA },
    { hacia: "abierto", etiqueta: "Devolver a la cola", nota: null },
  ],
  en_espera: [
    { hacia: "en_curso", etiqueta: "Retomar", nota: null },
    { hacia: "resuelto", etiqueta: "Resolver", nota: NOTA_SOLUCION },
  ],
  resuelto: [
    { hacia: "cerrado", etiqueta: "Cerrar", nota: null },
    { hacia: "abierto", etiqueta: "Reabrir", nota: NOTA_REAPERTURA },
  ],
  cerrado: [{ hacia: "abierto", etiqueta: "Reabrir", nota: NOTA_REAPERTURA }],
};

export function accionPara(desde: Estado, hacia: Estado): Accion | null {
  return ACCIONES[desde].find((a) => a.hacia === hacia) ?? null;
}

export const PRIORIDADES = ["baja", "media", "alta", "urgente"] as const;
export type Prioridad = (typeof PRIORIDADES)[number];

export const NOMBRE_PRIORIDAD: Record<Prioridad, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

/**
 * Horas hábiles para resolver, según la prioridad. El plazo solo corre en horario de oficina
 * (ver `horario.ts`) y se detiene mientras el ticket está en espera.
 */
export const HORAS_PLAZO: Record<Prioridad, number> = { urgente: 4, alta: 8, media: 16, baja: 40 };

export const DESCRIPCION_PRIORIDAD: Record<Prioridad, string> = {
  urgente: "Detiene la atención de público o a toda una unidad. Plazo: 4 horas hábiles.",
  alta: "Una persona no puede trabajar. Plazo: 8 horas hábiles, cerca de un día.",
  media: "Se puede trabajar, pero con dificultad. Plazo: 16 horas hábiles, cerca de dos días.",
  baja: "Consultas, instalaciones y mejoras. Plazo: 40 horas hábiles, cerca de una semana.",
};

/**
 * En el portal, quien pide ayuda no elige la prioridad: dice cuánto le afecta (el impacto, en ITIL)
 * y de ahí sale la prioridad inicial. El técnico la puede ajustar.
 */
export const IMPACTOS: readonly { prioridad: Prioridad; texto: string }[] = [
  { prioridad: "urgente", texto: "Está detenida la atención de público o toda mi unidad" },
  { prioridad: "alta", texto: "No puedo trabajar" },
  { prioridad: "media", texto: "Puedo trabajar, pero con dificultad" },
  { prioridad: "baja", texto: "Es una consulta, una instalación o un pedido" },
];

/** Cómo se le explica cada estado a quien pidió ayuda. */
export const ESTADO_PARA_SOLICITANTE: Record<Estado, string> = {
  abierto: "Recibida. Pronto la toma un técnico.",
  en_curso: "Un técnico está trabajando en ella.",
  en_espera: "En espera de algo para poder seguir (el detalle está en el historial).",
  resuelto: "Resuelta. Si el problema sigue, escríbenos más abajo.",
  cerrado: "Cerrada.",
};

/** Eventos que el solicitante ve en el portal sin que nadie los marque: la creación, los cambios de estado y quién lo atiende. */
export const EVENTOS_PUBLICOS = ["creado", "estado", "asignacion"] as const;
export const esEventoPublico = (tipo: string) => (EVENTOS_PUBLICOS as readonly string[]).includes(tipo);

export const CATEGORIAS = ["hardware", "software", "red", "impresoras", "cuentas", "telefonia", "otro"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  hardware: "Hardware",
  software: "Software",
  red: "Red e internet",
  impresoras: "Impresoras",
  cuentas: "Cuentas y accesos",
  telefonia: "Telefonía",
  otro: "Otro",
};

const MIN = 60_000;
const HORA = 60 * MIN;

/** Fin del plazo: las horas de la prioridad más el tiempo que pasó en espera, todo en tiempo hábil. */
export function calcularVencimiento(creadoEn: Date, prioridad: Prioridad, minutosPausa = 0): Date {
  return sumarHabiles(creadoEn, HORAS_PLAZO[prioridad] * HORA + minutosPausa * MIN);
}

/** Minutos hábiles entre dos instantes (para sumar a la pausa al salir de «en espera»). */
export function minutosHabiles(desde: Date, hasta: Date): number {
  return Math.max(0, Math.round(habilesEntre(desde, hasta) / MIN));
}

export type EstadoPlazo = "a_tiempo" | "por_vencer" | "vencido" | "pausado" | "cumplido" | "incumplido" | "sin_plazo";

export interface Plazo {
  estado: EstadoPlazo;
  /** Tiempo hábil en ms: positivo si queda, negativo si se pasó. */
  diferencia: number;
  /** Fracción del plazo ya usada (0 a 1), para la barra. */
  usado: number;
}

export interface DatosPlazo {
  estado: Estado;
  prioridad: Prioridad;
  venceEn: Date;
  resueltoEn: Date | null;
  pausadoDesde: Date | null;
}

/**
 * Estado del plazo de un ticket, en tiempo hábil. Pendiente: se compara con `ahora`
 * («por vencer» cuando queda un cuarto del plazo o menos). En espera: el reloj está detenido
 * desde que se pausó. Resuelto: se compara con la hora de resolución. Cerrado sin resolver: sin plazo.
 */
export function plazo(t: DatosPlazo, ahora: Date): Plazo {
  const total = HORAS_PLAZO[t.prioridad] * HORA;
  const conUso = (estado: EstadoPlazo, diferencia: number): Plazo => ({
    estado,
    diferencia,
    usado: Math.min(1, Math.max(0, 1 - diferencia / total)),
  });
  if (t.estado === "en_espera" && t.pausadoDesde) {
    return conUso("pausado", habilesEntre(t.pausadoDesde, t.venceEn));
  }
  if (estaPendiente(t.estado)) {
    if (ahora > t.venceEn) return conUso("vencido", -habilesEntre(t.venceEn, ahora));
    const diferencia = habilesEntre(ahora, t.venceEn);
    return conUso(diferencia <= total / 4 ? "por_vencer" : "a_tiempo", diferencia);
  }
  if (!t.resueltoEn) return { estado: "sin_plazo", diferencia: 0, usado: 0 };
  const cumplido = t.resueltoEn <= t.venceEn;
  return conUso(
    cumplido ? "cumplido" : "incumplido",
    cumplido ? habilesEntre(t.resueltoEn, t.venceEn) : -habilesEntre(t.venceEn, t.resueltoEn),
  );
}

/** «3 h 20 min», «15 min», «23 h». En horas, porque los días hábiles no miden lo mismo. */
export function duracion(ms: number): string {
  const min = Math.max(0, Math.round(Math.abs(ms) / MIN));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  // Desde 10 horas los minutos ya no aportan.
  return min % 60 && h < 10 ? `${h} h ${min % 60} min` : `${h} h`;
}

/** «4 h hábiles», pero «40 min» (con minutos no hace falta aclararlo). */
const habil = (ms: number) => (Math.abs(ms) < HORA ? duracion(ms) : `${duracion(ms)} hábiles`);

export function textoPlazo(p: Plazo): string {
  switch (p.estado) {
    case "a_tiempo":
    case "por_vencer":
      return `Quedan ${habil(p.diferencia)}`;
    case "vencido":
      return Math.abs(p.diferencia) < MIN ? "Vencido" : `Vencido hace ${habil(p.diferencia)}`;
    case "pausado":
      return p.diferencia > 0 ? `En pausa, quedan ${habil(p.diferencia)}` : "En pausa, ya estaba vencido";
    case "cumplido":
      return "Resuelto dentro del plazo";
    case "incumplido":
      return `Resuelto ${habil(p.diferencia)} fuera de plazo`;
    case "sin_plazo":
      return "Cerrado sin resolver";
  }
}

// ── Inventario ─────────────────────────────────────────────────────────────

export const TIPOS_EQUIPO = [
  "notebook",
  "escritorio",
  "monitor",
  "impresora",
  "switch",
  "router",
  "access_point",
  "telefono",
  "otro",
] as const;
export type TipoEquipo = (typeof TIPOS_EQUIPO)[number];

export const NOMBRE_TIPO: Record<TipoEquipo, string> = {
  notebook: "Notebook",
  escritorio: "PC de escritorio",
  monitor: "Monitor",
  impresora: "Impresora",
  switch: "Switch",
  router: "Router",
  access_point: "Access point",
  telefono: "Teléfono IP",
  otro: "Otro",
};

/** Prefijo del código de inventario (NB-0007, IMP-0012…). */
export const PREFIJO_TIPO: Record<TipoEquipo, string> = {
  notebook: "NB",
  escritorio: "PC",
  monitor: "MON",
  impresora: "IMP",
  switch: "SW",
  router: "RT",
  access_point: "AP",
  telefono: "TEL",
  otro: "OTR",
};

/** Tipos que normalmente tienen IP fija en la red. */
export const TIPOS_DE_RED: readonly TipoEquipo[] = ["impresora", "switch", "router", "access_point", "telefono"];

export const ESTADOS_EQUIPO = ["en_uso", "en_bodega", "en_reparacion", "de_baja"] as const;
export type EstadoEquipo = (typeof ESTADOS_EQUIPO)[number];

export const NOMBRE_ESTADO_EQUIPO: Record<EstadoEquipo, string> = {
  en_uso: "En uso",
  en_bodega: "En bodega",
  en_reparacion: "En reparación",
  de_baja: "De baja",
};

/** El siguiente código libre para un tipo: el mayor número usado con ese prefijo, más uno. */
export function siguienteCodigo(tipo: TipoEquipo, existentes: readonly string[]): string {
  const prefijo = PREFIJO_TIPO[tipo];
  const patron = new RegExp(`^${prefijo}-(\\d+)$`);
  let mayor = 0;
  for (const c of existentes) {
    const m = patron.exec(c);
    if (m) mayor = Math.max(mayor, Number(m[1]));
  }
  return `${prefijo}-${String(mayor + 1).padStart(4, "0")}`;
}

/** Unidades municipales que piden soporte. */
export const UNIDADES = [
  "Alcaldía",
  "Secretaría Municipal",
  "Administración y Finanzas",
  "Dirección de Obras",
  "Tránsito",
  "DIDECO",
  "Transparencia",
  "Informática",
  "Oficina de Partes",
  "Juzgado de Policía Local",
] as const;

/** Equipo técnico de la demo. Sin inicio de sesión, cada visitante elige como quién actúa. */
export const TECNICOS = ["Camila Rojas", "Diego Fuentes", "Valentina Soto"] as const;
export type Tecnico = (typeof TECNICOS)[number];
export const esTecnico = (x: unknown): x is Tecnico => typeof x === "string" && (TECNICOS as readonly string[]).includes(x);

export const esUno =
  <T extends string>(lista: readonly T[]) =>
  (x: unknown): x is T =>
    typeof x === "string" && (lista as readonly string[]).includes(x);
