import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { conectarPGlite, migrar, type BD } from "./db";
import {
  actualizarAsignacion,
  cambiarEstado,
  comentar,
  crearEquipo,
  crearTicket,
  listarEquipos,
  listarTickets,
  obtenerEquipo,
  obtenerTicket,
  resumen,
  vaciar,
} from "./datos";
import { plazo } from "./dominio";
import { sembrar } from "./semilla";
import { esquemaEquipo, esquemaTicketNuevo } from "./validacion";

const H = 3_600_000;
const t0 = new Date("2026-10-28T12:00:00Z");
const despues = (h: number) => new Date(t0.getTime() + h * H);

let bd: BD;
beforeAll(async () => {
  bd = await conectarPGlite();
  await migrar(bd);
});
beforeEach(() => vaciar(bd));

const nuevoTicket = (extra: Record<string, string> = {}) =>
  esquemaTicketNuevo.parse({
    titulo: "Sin internet en la oficina",
    descripcion: "Los computadores no navegan desde la mañana.",
    solicitante: "Ana Pérez",
    unidad: "Tránsito",
    categoria: "red",
    prioridad: "alta",
    ...extra,
  });

const nuevoEquipo = (extra: Record<string, string> = {}) =>
  esquemaEquipo.parse({ tipo: "impresora", marca: "HP", modelo: "M404dn", unidad: "Tránsito", estado: "en_uso", ...extra });

describe("ciclo de vida de un ticket", () => {
  it("crear, tomar, comentar, esperar, resolver y cerrar queda en el historial", async () => {
    const r = await crearTicket(bd, nuevoTicket(), "Camila Rojas", t0);
    expect(r.ok).toBe(true);
    const id = r.ok ? r.valor : 0;

    expect((await cambiarEstado(bd, id, "en_curso", null, "Diego Fuentes", despues(1))).ok).toBe(true);
    await comentar(bd, id, "Reviso el switch del piso.", "Diego Fuentes", despues(2));
    expect((await cambiarEstado(bd, id, "en_espera", "Llega un repuesto.", "Diego Fuentes", despues(3))).ok).toBe(true);
    expect((await cambiarEstado(bd, id, "en_curso", null, "Diego Fuentes", despues(4))).ok).toBe(true);
    expect((await cambiarEstado(bd, id, "resuelto", "Se cambió el patch cord.", "Diego Fuentes", despues(6))).ok).toBe(true);
    expect((await cambiarEstado(bd, id, "cerrado", null, "Camila Rojas", despues(30))).ok).toBe(true);

    const d = (await obtenerTicket(bd, id))!;
    expect(d.ticket).toMatchObject({ estado: "cerrado", tecnico: "Diego Fuentes" });
    expect(d.ticket.venceEn).toEqual(despues(8));
    expect(d.ticket.resueltoEn).toEqual(despues(6));
    expect(plazo(d.ticket, despues(100)).estado).toBe("cumplido");
    expect(d.eventos.map((e) => [e.tipo, e.hacia])).toEqual([
      ["creado", null],
      ["asignacion", "Diego Fuentes"],
      ["estado", "en_curso"],
      ["comentario", null],
      ["estado", "en_espera"],
      ["estado", "en_curso"],
      ["estado", "resuelto"],
      ["estado", "cerrado"],
    ]);
    expect(d.eventos.find((e) => e.hacia === "resuelto")?.texto).toBe("Se cambió el patch cord.");
  });

  it("rechaza cambios imposibles y los que necesitan nota sin nota", async () => {
    const r = await crearTicket(bd, nuevoTicket(), "Camila Rojas", t0);
    const id = r.ok ? r.valor : 0;
    expect(await cambiarEstado(bd, id, "cerrado", null, "Camila Rojas", t0)).toEqual({ ok: false, error: "Falta: motivo del cierre." });
    expect((await cambiarEstado(bd, id, "en_espera", null, "Camila Rojas", t0)).ok).toBe(false);
    await cambiarEstado(bd, id, "resuelto", "Listo.", "Camila Rojas", t0);
    expect((await cambiarEstado(bd, id, "en_curso", null, "Camila Rojas", t0)).ok).toBe(false);
    expect((await cambiarEstado(bd, 9999, "en_curso", null, "Camila Rojas", t0)).ok).toBe(false);
  });

  it("reabrir borra la fecha de resolución", async () => {
    const r = await crearTicket(bd, nuevoTicket(), "Camila Rojas", t0);
    const id = r.ok ? r.valor : 0;
    await cambiarEstado(bd, id, "resuelto", "Listo.", "Camila Rojas", despues(1));
    await cambiarEstado(bd, id, "abierto", "Volvió a fallar.", "Camila Rojas", despues(2));
    expect((await obtenerTicket(bd, id))!.ticket).toMatchObject({ estado: "abierto", resueltoEn: null });
  });

  it("cambiar la prioridad recalcula el plazo desde la creación y registra solo lo que cambió", async () => {
    const r = await crearTicket(bd, nuevoTicket({ prioridad: "baja" }), "Camila Rojas", t0);
    const id = r.ok ? r.valor : 0;
    const a = await actualizarAsignacion(bd, id, { tecnico: "Valentina Soto", prioridad: "urgente" }, "Camila Rojas", despues(1));
    expect(a).toEqual({ ok: true, valor: { cambios: 2 } });
    expect((await actualizarAsignacion(bd, id, { tecnico: "Valentina Soto", prioridad: "urgente" }, "Camila Rojas", despues(2))).ok).toBe(
      true,
    );
    const d = (await obtenerTicket(bd, id))!;
    expect(d.ticket.venceEn).toEqual(despues(4));
    expect(d.eventos.filter((e) => e.tipo !== "creado").map((e) => [e.tipo, e.desde, e.hacia])).toEqual([
      ["asignacion", null, "Valentina Soto"],
      ["prioridad", "baja", "urgente"],
    ]);
  });
});

describe("listados", () => {
  it("filtra por estado, técnico, texto y número, y ordena los pendientes por vencimiento", async () => {
    const ids: number[] = [];
    for (const [titulo, prioridad] of [
      ["Monitor parpadea", "baja"],
      ["Sin internet", "urgente"],
      ["Cambiar tóner", "media"],
    ] as const) {
      const r = await crearTicket(bd, nuevoTicket({ titulo, prioridad }), "Camila Rojas", t0);
      if (r.ok) ids.push(r.valor);
    }
    await cambiarEstado(bd, ids[2], "resuelto", "Listo.", "Camila Rojas", despues(1));
    await cambiarEstado(bd, ids[0], "en_curso", null, "Diego Fuentes", despues(1));

    expect((await listarTickets(bd)).map((t) => t.titulo)).toEqual(["Sin internet", "Monitor parpadea"]);
    expect((await listarTickets(bd, { estado: "todos" })).length).toBe(3);
    expect((await listarTickets(bd, { estado: "resuelto" })).map((t) => t.id)).toEqual([ids[2]]);
    expect((await listarTickets(bd, { tecnico: "sin_asignar" })).map((t) => t.id)).toEqual([ids[1]]);
    expect((await listarTickets(bd, { tecnico: "Diego Fuentes" })).map((t) => t.id)).toEqual([ids[0]]);
    expect((await listarTickets(bd, { estado: "todos", q: "TÓNER" })).map((t) => t.id)).toEqual([ids[2]]);
    expect((await listarTickets(bd, { estado: "todos", q: `#${ids[1]}` })).map((t) => t.id)).toEqual([ids[1]]);
    expect((await listarTickets(bd, { estado: "todos", q: "100%_" })).length).toBe(0);
  });
});

describe("inventario", () => {
  it("asigna códigos correlativos por tipo y cuenta los tickets pendientes de cada equipo", async () => {
    const a = await crearEquipo(bd, nuevoEquipo(), t0);
    const b = await crearEquipo(bd, nuevoEquipo({ ip: "192.168.10.30" }), t0);
    const c = await crearEquipo(bd, nuevoEquipo({ tipo: "notebook", marca: "Lenovo", modelo: "E14" }), t0);
    expect([a, b, c].every((r) => r.ok)).toBe(true);
    const idB = b.ok ? b.valor : 0;
    await crearTicket(bd, nuevoTicket({ categoria: "impresoras", equipoId: String(idB) }), "Camila Rojas", t0);

    const lista = await listarEquipos(bd);
    expect(lista.map((e) => [e.codigo, e.pendientes])).toEqual([
      ["IMP-0001", 0],
      ["IMP-0002", 1],
      ["NB-0001", 0],
    ]);
    expect((await listarEquipos(bd, { q: "10.30" })).map((e) => e.codigo)).toEqual(["IMP-0002"]);
    expect((await obtenerEquipo(bd, idB))!.tickets.length).toBe(1);
  });

  it("no permite asociar un ticket a un equipo que no existe", async () => {
    expect(await crearTicket(bd, nuevoTicket({ equipoId: "777" }), "Camila Rojas", t0)).toEqual({
      ok: false,
      error: "El equipo elegido ya no existe.",
    });
  });
});

describe("datos de ejemplo", () => {
  it("se cargan y dan un panel con de todo", async () => {
    const r = await sembrar(bd, t0);
    expect(r.tickets).toBe(75);
    expect(r.equipos).toBeGreaterThan(40);
    const p = await resumen(bd, t0);
    expect(p.pendientes).toBeGreaterThan(5);
    expect(p.vencidos).toBeGreaterThan(0);
    expect(p.atencion.length).toBe(Math.min(8, p.vencidos + p.porVencer));
    expect(p.cumplimiento30).toBeGreaterThan(50);
    expect(p.equiposPorEstado.find((e) => e.estado === "de_baja")?.n).toBe(2);
    // Ningún ticket tiene eventos antes de su creación ni después de ahora.
    const todos = await listarTickets(bd, { estado: "todos" }, 1000);
    for (const t of todos.slice(0, 20)) {
      const d = (await obtenerTicket(bd, t.id))!;
      for (const e of d.eventos) {
        expect(e.creadoEn.getTime()).toBeGreaterThanOrEqual(t.creadoEn.getTime());
        expect(e.creadoEn.getTime()).toBeLessThanOrEqual(t0.getTime());
      }
    }
  });
});
