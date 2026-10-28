/** Fechas en la hora de Chile, aunque el servidor (Vercel) corra en UTC. */
const ZONA = "America/Santiago";

const fechaHora = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: ZONA,
});
const fechaHoraAnio = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: ZONA,
});
const fechaLarga = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", timeZone: ZONA });
const soloFecha = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const anioDe = (d: Date) => new Intl.DateTimeFormat("es-CL", { year: "numeric", timeZone: ZONA }).format(d);

const limpiar = (s: string) => s.replaceAll(".", "").replace(",", "");

/** «28 oct 14:05»; con el año si no es el actual. */
export function formatearFechaHora(d: Date, ahora = new Date()): string {
  return limpiar((anioDe(d) === anioDe(ahora) ? fechaHora : fechaHoraAnio).format(d));
}

const conDia = new Intl.DateTimeFormat("es-CL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: ZONA,
});

/** «jue 29 oct 09:00»: para vencimientos, donde importa el día de la semana. */
export function formatearConDia(d: Date): string {
  return limpiar(conDia.format(d)).replace(/,/g, "");
}

/** «miércoles 28 de octubre». */
export function formatearDia(d: Date): string {
  return fechaLarga.format(d);
}

/** Fecha sin hora guardada como AAAA-MM-DD: «12 de marzo de 2023». */
export function formatearFecha(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  return soloFecha.format(new Date(Date.UTC(a, m - 1, d)));
}

/** «hace 5 min», «hace 3 h», «hace 2 d». */
export function hace(d: Date, ahora: Date): string {
  const min = Math.max(0, Math.floor((ahora.getTime() - d.getTime()) / 60_000));
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}
