import { MAPA_FERIADOS } from "./feriados";

/**
 * Tiempo hábil: el plazo de un ticket solo corre en horario de oficina, de lunes a viernes,
 * sin feriados. Todo se calcula en la hora de Chile (con su cambio de horario), aunque el
 * servidor corra en UTC.
 */

const ZONA = "America/Santiago";
const MIN = 60_000;
const H = 60 * MIN;
const DIA = 24 * H;

/** Horario de atención por día de la semana (0 = domingo), en minutos desde la medianoche. */
export const HORARIO: Record<number, readonly [number, number] | null> = {
  0: null,
  1: [8 * 60 + 30, 17 * 60 + 30],
  2: [8 * 60 + 30, 17 * 60 + 30],
  3: [8 * 60 + 30, 17 * 60 + 30],
  4: [8 * 60 + 30, 17 * 60 + 30],
  5: [8 * 60 + 30, 16 * 60 + 30],
  6: null,
};

export const TEXTO_HORARIO = "lunes a jueves de 8:30 a 17:30 y viernes de 8:30 a 16:30, sin feriados";

const partes = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

interface Local {
  /** AAAA-MM-DD en Chile. */
  fecha: string;
  /** Milisegundos desde la medianoche de Chile. */
  ms: number;
}

/** El instante `d` como fecha y hora de pared en Chile. */
export function aLocal(d: Date): Local {
  const p: Record<string, string> = {};
  for (const x of partes.formatToParts(d)) p[x.type] = x.value;
  const ms = (Number(p.hour) * 60 + Number(p.minute)) * MIN + Number(p.second) * 1000 + d.getUTCMilliseconds();
  return { fecha: `${p.year}-${p.month}-${p.day}`, ms };
}

/** Diferencia entre la hora de Chile y UTC en ese instante (−3 h o −4 h). */
function desfase(t: number): number {
  const l = aLocal(new Date(t));
  const [a, m, d] = l.fecha.split("-").map(Number);
  return Date.UTC(a, m - 1, d) + l.ms - t;
}

/** El instante en que en Chile es `fecha` a los `ms` desde la medianoche. */
export function desdeLocal(fecha: string, ms: number): Date {
  const [a, m, d] = fecha.split("-").map(Number);
  const ingenuo = Date.UTC(a, m - 1, d) + ms;
  let t = ingenuo + 3 * H;
  for (let i = 0; i < 3; i++) {
    const siguiente = ingenuo - desfase(t);
    if (siguiente === t) break;
    t = siguiente;
  }
  return new Date(t);
}

function diaSemana(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

export function sumarDia(fecha: string, n = 1): string {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d) + n * DIA).toISOString().slice(0, 10);
}

/** Ventana de atención de ese día en ms desde la medianoche, o null si no se atiende. */
export function ventana(fecha: string): readonly [number, number] | null {
  if (MAPA_FERIADOS.has(fecha)) return null;
  const h = HORARIO[diaSemana(fecha)];
  return h ? [h[0] * MIN, h[1] * MIN] : null;
}

export const esDiaHabil = (fecha: string) => ventana(fecha) !== null;

/** El instante en que se cumplen `ms` de tiempo hábil contados desde `desde`. */
export function sumarHabiles(desde: Date, ms: number): Date {
  if (ms <= 0) return desde;
  let { fecha, ms: hora } = aLocal(desde);
  for (let i = 0; i < 1000; i++) {
    const v = ventana(fecha);
    if (v) {
      const inicio = Math.max(hora, v[0]);
      if (inicio < v[1]) {
        const disponible = v[1] - inicio;
        if (ms <= disponible) return desdeLocal(fecha, inicio + ms);
        ms -= disponible;
      }
    }
    fecha = sumarDia(fecha);
    hora = 0;
  }
  throw new Error("Plazo demasiado largo");
}

/** Tiempo hábil entre `a` y `b`, en ms. Negativo si `b` es anterior a `a`. */
export function habilesEntre(a: Date, b: Date): number {
  if (b < a) return -habilesEntre(b, a);
  const la = aLocal(a);
  const lb = aLocal(b);
  let total = 0;
  for (let fecha = la.fecha, i = 0; fecha <= lb.fecha && i < 5000; fecha = sumarDia(fecha), i++) {
    const v = ventana(fecha);
    if (!v) continue;
    const desde = Math.max(v[0], fecha === la.fecha ? la.ms : 0);
    const hasta = Math.min(v[1], fecha === lb.fecha ? lb.ms : DIA);
    if (hasta > desde) total += hasta - desde;
  }
  return total;
}

/** El siguiente momento hábil desde `d` (el mismo `d` si ya es horario de atención). */
export function proximoHabil(d: Date): Date {
  let { fecha, ms } = aLocal(d);
  for (let i = 0; i < 1000; i++) {
    const v = ventana(fecha);
    if (v && ms < v[1]) return ms >= v[0] ? d : desdeLocal(fecha, v[0]);
    fecha = sumarDia(fecha);
    ms = 0;
  }
  throw new Error("Sin días hábiles");
}
