import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { cambiarEstado, crearTicket, obtenerTicket, vaciar } from "./datos";
import { conectarPGlite, migrar, type BD } from "./db";
import {
  crearProblema,
  duplicadosDe,
  listarProblemas,
  marcarDuplicado,
  obtenerProblema,
  resolverProblema,
  vincularProblema,
} from "./relacionados";
import { esquemaTicketNuevo } from "./validacion";

const t0 = new Date("2026-10-28T12:00:00Z");
const despues = (h: number) => new Date(t0.getTime() + h * 3_600_000);

let bd: BD;
beforeAll(async () => {
  bd = await conectarPGlite();
  await migrar(bd);
});
beforeEach(() => vaciar(bd));

async function ticket(titulo: string) {
  const r = await crearTicket(
    bd,
    esquemaTicketNuevo.parse({
      titulo,
      descripcion: "Sin conexión desde la mañana.",
      solicitante: "Ana Pérez",
      unidad: "Dirección de Obras",
      categoria: "red",
      prioridad: "alta",
    }),
    "Camila Rojas",
    t0,
  );
  if (!r.ok) throw new Error(r.error);
  return r.valor;
}

describe("duplicados", () => {
  it("cierra el duplicado, lo explica al solicitante y lo anota en el original", async () => {
    const a = await ticket("Sin internet en Obras");
    const b = await ticket("No hay red en el segundo piso");
    expect(await marcarDuplicado(bd, b, a, "Diego Fuentes", despues(1))).toEqual({ ok: true, valor: a });
    const db = (await obtenerTicket(bd, b))!;
    expect(db.ticket).toMatchObject({ estado: "cerrado", duplicadoDe: a });
    expect(db.eventos.at(-1)).toMatchObject({
      tipo: "estado",
      hacia: "cerrado",
      publico: true,
      texto: `Es el mismo caso que el ticket #${a}; se atiende allí.`,
    });
    expect((await obtenerTicket(bd, a))!.eventos.at(-1)).toMatchObject({ tipo: "relacion", publico: false });
    expect((await duplicadosDe(bd, a)).map((d) => d.id)).toEqual([b]);
  });

  it("apunta siempre al original y rechaza casos imposibles", async () => {
    const a = await ticket("Sin internet en Obras");
    const b = await ticket("Sin red");
    const c = await ticket("Internet caído");
    await marcarDuplicado(bd, b, a, "Diego Fuentes", despues(1));
    expect(await marcarDuplicado(bd, c, b, "Diego Fuentes", despues(1))).toEqual({ ok: true, valor: a });
    expect((await marcarDuplicado(bd, a, a, "Diego Fuentes", despues(1))).ok).toBe(false);
    expect((await marcarDuplicado(bd, b, a, "Diego Fuentes", despues(1))).ok).toBe(false); // ya cerrado
    expect((await marcarDuplicado(bd, a, 999, "Diego Fuentes", despues(1))).ok).toBe(false);
  });
});

describe("problemas", () => {
  it("agrupa tickets y al resolverlo resuelve los pendientes con la misma solución", async () => {
    const a = await ticket("Sin internet en Obras");
    const b = await ticket("No hay red en el segundo piso");
    const c = await ticket("Teléfono sin tono en Obras");
    await cambiarEstado(bd, c, "resuelto", "Se reinició el teléfono.", "Diego Fuentes", despues(1));
    const p = await crearProblema(bd, { titulo: "Se cae el switch de Obras", descripcion: null }, "Diego Fuentes", despues(1), a);
    if (!p.ok) throw new Error(p.error);
    await vincularProblema(bd, b, p.valor, "Diego Fuentes", despues(1));
    await vincularProblema(bd, c, p.valor, "Diego Fuentes", despues(1));

    expect((await listarProblemas(bd))[0]).toMatchObject({ titulo: "Se cae el switch de Obras", total: 3, pendientes: 2 });
    const r = await resolverProblema(
      bd,
      p.valor,
      { causa: "Fuente de poder dañada.", solucion: "Se cambió la fuente del switch.", resolverTickets: true },
      "Diego Fuentes",
      despues(3),
    );
    expect(r).toEqual({ ok: true, valor: { ticketsResueltos: 2 } });
    const d = (await obtenerProblema(bd, p.valor))!;
    expect(d.problema).toMatchObject({ estado: "resuelto", causa: "Fuente de poder dañada." });
    expect(d.tickets.map((t) => t.estado).sort()).toEqual(["resuelto", "resuelto", "resuelto"]);
    expect((await obtenerTicket(bd, b))!.eventos.at(-1)).toMatchObject({ hacia: "resuelto", texto: "Se cambió la fuente del switch." });
    // No se vincula a un problema resuelto.
    expect((await vincularProblema(bd, a, p.valor, "Diego Fuentes", despues(4))).ok).toBe(true); // ya estaba
    const otro = await ticket("Otro problema de red");
    expect((await vincularProblema(bd, otro, p.valor, "Diego Fuentes", despues(4))).ok).toBe(false);
  });

  it("se puede quitar un ticket del problema", async () => {
    const a = await ticket("Sin internet en Obras");
    const p = await crearProblema(bd, { titulo: "Switch", descripcion: null }, "Diego Fuentes", despues(1), a);
    if (!p.ok) throw new Error(p.error);
    await vincularProblema(bd, a, null, "Diego Fuentes", despues(2));
    expect((await obtenerTicket(bd, a))!.ticket.problemaId).toBeNull();
    expect((await obtenerTicket(bd, a))!.eventos.at(-1)?.texto).toBe(`Lo quitó del problema #${p.valor}`);
  });
});
