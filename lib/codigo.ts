/**
 * Códigos de seguimiento del portal (ABCD-2345). Sin letras ni números que se confundan
 * al dictarlos o escribirlos (0/O, 1/I/L).
 */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function nuevoCodigo(azar: () => number = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALFABETO[Math.floor(azar() * ALFABETO.length)];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

/** Acepta el código en minúsculas, con espacios o sin guion. Devuelve null si no tiene la forma. */
export function normalizarCodigo(texto: string): string | null {
  const t = texto.toUpperCase().replace(/[\s-]/g, "");
  return /^[A-Z0-9]{8}$/.test(t) ? `${t.slice(0, 4)}-${t.slice(4)}` : null;
}
