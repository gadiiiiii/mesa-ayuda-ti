/** Lectura segura de los parámetros de búsqueda de la URL. */
export type Parametros = Record<string, string | string[] | undefined>;

export function texto(p: Parametros, clave: string): string {
  const v = p[clave];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export function opcion<T extends string>(p: Parametros, clave: string, validas: readonly T[]): T | undefined {
  const v = texto(p, clave);
  return (validas as readonly string[]).includes(v) ? (v as T) : undefined;
}
