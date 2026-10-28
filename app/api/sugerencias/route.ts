import { buscarArticulos } from "@/lib/conocimiento";
import { obtenerBD } from "@/lib/db";

/** Artículos públicos parecidos a lo que se está escribiendo en el portal. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 200) ?? "";
  if (q.length < 4) return Response.json([]);
  const r = await buscarArticulos(await obtenerBD(), { q, soloPublicos: true }, 3);
  return Response.json(r.map((a) => ({ id: a.id, titulo: a.titulo })));
}
