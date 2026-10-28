import { obtenerBD } from "@/lib/db";
import { aCSV, cargarDatos } from "@/lib/metricas";

/** Descarga en CSV los tickets creados o resueltos en los últimos `dias` días. */
export async function GET(req: Request) {
  const dias = Number(new URL(req.url).searchParams.get("dias")) === 90 ? 90 : 30;
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - dias * 86_400_000);
  const csv = aCSV(await cargarDatos(await obtenerBD(), desde, hasta));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tickets-ultimos-${dias}-dias.csv"`,
    },
  });
}
