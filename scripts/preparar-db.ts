/**
 * Aplica las migraciones pendientes y, si la base está vacía, carga los datos de ejemplo.
 * Corre antes de `next dev` y de `next build` (en Vercel, contra Neon).
 */
import { count } from "drizzle-orm";
import { conectarNeon, migrar, obtenerBD } from "../lib/db";
import { equipos } from "../lib/db/esquema";
import { sembrar } from "../lib/semilla";

async function main() {
  const destino = process.env.DATABASE_URL ? "Postgres (DATABASE_URL)" : `PGlite en ${process.env.PGLITE_DIR ?? ".pglite"}`;
  // Para migrar conviene la conexión directa (sin el pooler), si Neon la entrega.
  const directa = process.env.DATABASE_URL_UNPOOLED;
  const bd = directa ? await conectarNeon(directa) : await obtenerBD();
  await migrar(bd);
  const [{ n }] = await bd.select({ n: count() }).from(equipos);
  if (Number(n) === 0) {
    const r = await sembrar(bd, new Date());
    console.log(`Base lista (${destino}): migraciones aplicadas y ${r.equipos} equipos y ${r.tickets} tickets de ejemplo.`);
  } else {
    console.log(`Base lista (${destino}): migraciones al día, ya tenía datos.`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("No se pudo preparar la base de datos:", e);
  process.exit(1);
});
