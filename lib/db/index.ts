import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as esquema from "./esquema";

/**
 * La base de datos. En producción es Postgres en Neon (variable DATABASE_URL);
 * sin esa variable, en desarrollo y en los tests, es PGlite: el mismo Postgres
 * compilado a WebAssembly, guardado en la carpeta `.pglite/` o en memoria.
 */
export type BD = PgDatabase<PgQueryResultHKT, typeof esquema>;

export const CARPETA_MIGRACIONES = "drizzle";

export async function conectarNeon(url: string): Promise<BD> {
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;
  return drizzle({ client: new Pool({ connectionString: url }), schema: esquema }) as unknown as BD;
}

/** `dataDir` vacío o "memory://" crea una base en memoria (para los tests). */
export async function conectarPGlite(dataDir?: string): Promise<BD> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  return drizzle({ client: new PGlite(dataDir), schema: esquema }) as unknown as BD;
}

export async function migrar(bd: BD): Promise<void> {
  if (process.env.DATABASE_URL) {
    const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
    await migrate(bd as never, { migrationsFolder: CARPETA_MIGRACIONES });
  } else {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(bd as never, { migrationsFolder: CARPETA_MIGRACIONES });
  }
}

// Una sola conexión por proceso. En desarrollo Next recarga los módulos, así que se guarda en globalThis
// (dos instancias de PGlite sobre la misma carpeta la dañarían).
const global = globalThis as unknown as { __bd?: Promise<BD> };

export function obtenerBD(): Promise<BD> {
  global.__bd ??= process.env.DATABASE_URL ? conectarNeon(process.env.DATABASE_URL) : conectarPGlite(process.env.PGLITE_DIR ?? ".pglite");
  return global.__bd;
}
