import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { actualizarEquipo, crearEquipo, vaciar } from "./datos";
import { conectarPGlite, migrar, type BD } from "./db";
import {
  agendaMantenciones,
  contarMantencionesVencidas,
  estadoGarantia,
  estadoMantencion,
  listarMovimientos,
  mantencionesDeEquipo,
  programarMantencion,
  realizarMantencion,
  sumarMeses,
} from "./inventario";
import { esquemaEquipo } from "./validacion";

describe("fechas del inventario", () => {
  it("suma meses sin pasarse del último día", () => {
    expect(sumarMeses("2026-01-31", 1)).toBe("2026-02-28");
    expect(sumarMeses("2026-10-28", 6)).toBe("2027-04-28");
    expect(sumarMeses("2026-10-28", -12)).toBe("2025-10-28");
  });
  it("estado de la garantía", () => {
    expect(estadoGarantia(null, "2026-10-28").estado).toBe("sin_dato");
    expect(estadoGarantia("2027-10-28", "2026-10-28").estado).toBe("vigente");
    expect(estadoGarantia("2026-12-01", "2026-10-28")).toEqual({ estado: "por_vencer", dias: 34 });
    expect(estadoGarantia("2026-10-27", "2026-10-28")).toEqual({ estado: "vencida", dias: -1 });
  });
  it("estado de una mantención", () => {
    expect(estadoMantencion({ programadaPara: "2026-10-20", realizadaEn: null }, "2026-10-28")).toBe("vencida");
    expect(estadoMantencion({ programadaPara: "2026-11-20", realizadaEn: null }, "2026-10-28")).toBe("proxima");
    expect(estadoMantencion({ programadaPara: "2027-01-20", realizadaEn: null }, "2026-10-28")).toBe("programada");
    expect(estadoMantencion({ programadaPara: "2026-10-20", realizadaEn: new Date() }, "2026-10-28")).toBe("realizada");
  });
});

describe("historial y mantenciones", () => {
  let bd: BD;
  const t0 = new Date("2026-10-28T12:00:00Z");
  beforeAll(async () => {
    bd = await conectarPGlite();
    await migrar(bd);
  });
  beforeEach(() => vaciar(bd));

  const equipo = async () => {
    const r = await crearEquipo(
      bd,
      esquemaEquipo.parse({
        tipo: "impresora",
        marca: "HP",
        modelo: "M404dn",
        unidad: "Tránsito",
        estado: "en_uso",
        responsable: "Ana Pérez",
      }),
      t0,
      "Diego Fuentes",
    );
    if (!r.ok) throw new Error(r.error);
    return r.valor;
  };

  it("registra el alta y solo los campos que cambian", async () => {
    const id = await equipo();
    await actualizarEquipo(
      bd,
      id,
      esquemaEquipo
        .omit({ tipo: true })
        .parse({ marca: "HP", modelo: "M404dn", unidad: "DIDECO", estado: "en_uso", responsable: "Ana Pérez", ip: "192.168.10.9" }),
      new Date(t0.getTime() + 3_600_000),
      "Camila Rojas",
    );
    const h = await listarMovimientos(bd, id);
    expect(h.map((m) => [m.campo, m.desde, m.hacia, m.autor])).toEqual([
      ["unidad", "Tránsito", "DIDECO", "Camila Rojas"],
      ["ip", null, "192.168.10.9", "Camila Rojas"],
      ["alta", null, "Tránsito", "Diego Fuentes"],
    ]);
  });

  it("al realizar una mantención periódica se programa la siguiente", async () => {
    const id = await equipo();
    const p = await programarMantencion(
      bd,
      { equipoId: id, tipo: "Limpieza", programadaPara: "2026-10-20", cadaMeses: 6 },
      "Diego Fuentes",
      t0,
    );
    if (!p.ok) throw new Error(p.error);
    expect(await contarMantencionesVencidas(bd, "2026-10-28")).toBe(1);
    expect((await agendaMantenciones(bd, "2026-10-28")).pendientes.map((m) => m.programadaPara)).toEqual(["2026-10-20"]);

    expect(await realizarMantencion(bd, p.valor, "Se limpió el rodillo.", "Diego Fuentes", t0, "2026-10-28")).toEqual({
      ok: true,
      valor: { siguiente: "2027-04-28" },
    });
    expect((await realizarMantencion(bd, p.valor, null, "Diego Fuentes", t0, "2026-10-28")).ok).toBe(false);
    const lista = await mantencionesDeEquipo(bd, id);
    expect(lista.map((m) => [m.programadaPara, m.realizadaEn !== null])).toEqual([
      ["2026-10-20", true],
      ["2027-04-28", false],
    ]);
    expect(await contarMantencionesVencidas(bd, "2026-10-28")).toBe(0);
  });
});
