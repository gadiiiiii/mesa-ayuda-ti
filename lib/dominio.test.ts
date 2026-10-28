import { describe, expect, it } from "vitest";
import { ACCIONES, ESTADOS, accionPara, calcularVencimiento, duracion, plazo, siguienteCodigo, textoPlazo } from "./dominio";

const H = 3_600_000;
const base = new Date("2026-10-28T12:00:00Z");

describe("estados", () => {
  it("cada acción lleva a un estado distinto del actual", () => {
    for (const e of ESTADOS) for (const a of ACCIONES[e]) expect(a.hacia).not.toBe(e);
  });
  it("resolver y cerrar sin resolver piden nota; tomar no", () => {
    expect(accionPara("abierto", "resuelto")?.nota).not.toBeNull();
    expect(accionPara("abierto", "cerrado")?.nota).not.toBeNull();
    expect(accionPara("abierto", "en_curso")?.nota).toBeNull();
    expect(accionPara("resuelto", "cerrado")?.nota).toBeNull();
  });
  it("no se puede saltar de cerrado a resuelto", () => {
    expect(accionPara("cerrado", "resuelto")).toBeNull();
    expect(accionPara("en_espera", "abierto")).toBeNull();
  });
  it("todo estado se puede reabrir o terminar", () => {
    for (const e of ESTADOS) expect(ACCIONES[e].length).toBeGreaterThan(0);
  });
});

describe("plazos", () => {
  const t = (prioridad: "urgente" | "media", estado: "abierto" | "resuelto" | "cerrado" = "abierto", resueltoEn: Date | null = null) => ({
    estado,
    prioridad,
    creadoEn: base,
    venceEn: calcularVencimiento(base, prioridad),
    resueltoEn,
  });

  it("calcula el vencimiento con las horas de la prioridad", () => {
    expect(calcularVencimiento(base, "urgente").getTime() - base.getTime()).toBe(4 * H);
    expect(calcularVencimiento(base, "baja").getTime() - base.getTime()).toBe(72 * H);
  });

  it("a tiempo, por vencer (último cuarto) y vencido", () => {
    expect(plazo(t("urgente"), new Date(base.getTime() + 2 * H)).estado).toBe("a_tiempo");
    expect(plazo(t("urgente"), new Date(base.getTime() + 3 * H)).estado).toBe("por_vencer");
    expect(plazo(t("urgente"), new Date(base.getTime() + 4 * H + 1)).estado).toBe("vencido");
    expect(plazo(t("media"), new Date(base.getTime() + 17 * H)).estado).toBe("a_tiempo");
    expect(plazo(t("media"), new Date(base.getTime() + 18 * H)).estado).toBe("por_vencer");
  });

  it("una vez resuelto se compara con la hora de resolución, no con ahora", () => {
    const ahora = new Date(base.getTime() + 100 * H);
    expect(plazo(t("urgente", "resuelto", new Date(base.getTime() + 3 * H)), ahora).estado).toBe("cumplido");
    expect(plazo(t("urgente", "resuelto", new Date(base.getTime() + 6 * H)), ahora)).toEqual({ estado: "incumplido", diferencia: -2 * H });
    expect(plazo(t("urgente", "cerrado"), ahora).estado).toBe("sin_plazo");
  });

  it("escribe las duraciones en palabras", () => {
    expect(duracion(15 * 60_000)).toBe("15 min");
    expect(duracion(3 * H + 20 * 60_000)).toBe("3 h 20 min");
    expect(duracion(-5 * H)).toBe("5 h");
    expect(duracion(21 * H + 11 * 60_000)).toBe("21 h");
    expect(duracion(52 * H)).toBe("2 d 4 h");
    expect(textoPlazo({ estado: "vencido", diferencia: -2 * H })).toBe("Vencido hace 2 h");
    expect(textoPlazo({ estado: "incumplido", diferencia: -2 * H })).toBe("Resuelto 2 h fuera de plazo");
  });
});

describe("códigos de inventario", () => {
  it("sigue al mayor número del mismo tipo", () => {
    expect(siguienteCodigo("notebook", [])).toBe("NB-0001");
    expect(siguienteCodigo("notebook", ["NB-0001", "NB-0009", "PC-0040", "NB-0003"])).toBe("NB-0010");
    expect(siguienteCodigo("impresora", ["IMP-0002", "IMPX-0099"])).toBe("IMP-0003");
  });
});
