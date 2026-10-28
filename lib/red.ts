/** Lectura y formato de direcciones IPv4 y MAC del inventario. */

/** Devuelve la IP sin ceros a la izquierda, o null si no es una IPv4 válida. */
export function normalizarIPv4(texto: string): string | null {
  const partes = texto.trim().split(".");
  if (partes.length !== 4) return null;
  const octetos: number[] = [];
  for (const p of partes) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    octetos.push(n);
  }
  return octetos.join(".");
}

/**
 * Devuelve la MAC como `AA:BB:CC:DD:EE:FF`, o null si no es válida.
 * Acepta separadores `:` o `-`, el formato de Cisco (`aabb.ccdd.eeff`) o los 12 dígitos seguidos.
 */
export function normalizarMAC(texto: string): string | null {
  const t = texto.trim();
  let hex: string;
  if (/^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/i.test(t) || /^[0-9a-f]{2}(-[0-9a-f]{2}){5}$/i.test(t)) hex = t.replace(/[:-]/g, "");
  else if (/^[0-9a-f]{4}(\.[0-9a-f]{4}){2}$/i.test(t)) hex = t.replace(/\./g, "");
  else if (/^[0-9a-f]{12}$/i.test(t)) hex = t;
  else return null;
  return hex.toUpperCase().match(/../g)!.join(":");
}

/** Para ordenar IPs como números y no como texto (10.0.0.9 antes que 10.0.0.10). */
export function claveIPv4(ip: string): number {
  return ip.split(".").reduce((acc, o) => acc * 256 + Number(o), 0);
}
