import type { EstadoMantencion } from "./dominio";

/** Fechas del inventario (AAAA-MM-DD), sin base de datos: se usan también en el navegador. */

export type EstadoGarantia = "sin_dato" | "vigente" | "por_vencer" | "vencida";

/** Días entre dos fechas AAAA-MM-DD (positivo si `b` es posterior). */
export function diasEntre(a: string, b: string): number {
  const f = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((f(b) - f(a)) / 86_400_000);
}

/** «Por vencer» cuando quedan 60 días o menos. */
export function estadoGarantia(garantiaHasta: string | null, hoy: string): { estado: EstadoGarantia; dias: number } {
  if (!garantiaHasta) return { estado: "sin_dato", dias: 0 };
  const dias = diasEntre(hoy, garantiaHasta);
  return { estado: dias < 0 ? "vencida" : dias <= 60 ? "por_vencer" : "vigente", dias };
}

/** Suma meses a una fecha AAAA-MM-DD; si el día no existe en ese mes, usa el último (31 ene + 1 = 28 feb). */
export function sumarMeses(fecha: string, meses: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const total = m - 1 + meses;
  const anio = y + Math.floor(total / 12);
  const mes = ((total % 12) + 12) % 12;
  const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(Math.min(d, ultimo)).padStart(2, "0")}`;
}

/** «Próxima» si toca en los próximos 30 días. */
export function estadoMantencion(m: { programadaPara: string; realizadaEn: Date | null }, hoy: string): EstadoMantencion {
  if (m.realizadaEn) return "realizada";
  const dias = diasEntre(hoy, m.programadaPara);
  return dias < 0 ? "vencida" : dias <= 30 ? "proxima" : "programada";
}
