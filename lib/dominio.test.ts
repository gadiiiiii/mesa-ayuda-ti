import { describe, expect, it } from "vitest";
import { ACCIONES, ESTADOS, elegirTecnico, accionPara, calcularVencimiento, duracion, plazo, siguienteCodigo, textoPlazo } from "./dominio";

const H = 3_600_000;

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

describe("plazos en tiempo hábil", () => {
  // Miércoles 28 de octubre de 2026, 9:00 en Chile.
  const base = new Date("2026-10-28T12:00:00Z");
  const t = (prioridad: "urgente" | "media", extra: Partial<Parameters<typeof plazo>[0]> = {}) => ({
    estado: "abierto" as const,
    prioridad,
    venceEn: calcularVencimiento(base, prioridad),
    resueltoEn: null,
    pausadoDesde: null,
    ...extra,
  });

  it("el vencimiento cuenta solo horas de oficina", () => {
    // Urgente: 4 h → 13:00 del mismo día. Media: 16 h → 9 h el miércoles (8,5 h hasta las 17:30) y 7,5 h el jueves.
    expect(calcularVencimiento(base, "urgente").toISOString()).toBe("2026-10-28T16:00:00.000Z");
    expect(calcularVencimiento(base, "media").toISOString()).toBe("2026-10-29T19:00:00.000Z");
    // La pausa alarga el plazo en tiempo hábil.
    expect(calcularVencimiento(base, "urgente", 60).toISOString()).toBe("2026-10-28T17:00:00.000Z");
  });

  it("a tiempo, por vencer (último cuarto) y vencido", () => {
    expect(plazo(t("urgente"), new Date(base.getTime() + 2 * H)).estado).toBe("a_tiempo");
    expect(plazo(t("urgente"), new Date(base.getTime() + 3 * H))).toMatchObject({ estado: "por_vencer", diferencia: H, usado: 0.75 });
    expect(plazo(t("urgente"), new Date(base.getTime() + 5 * H))).toMatchObject({ estado: "vencido", diferencia: -H, usado: 1 });
  });

  it("de noche no corre el plazo", () => {
    // Media vence el jueves a las 16:00: el miércoles a las 23:00 todavía quedan 7,5 h hábiles.
    const noche = new Date("2026-10-29T02:00:00Z");
    expect(plazo(t("media"), noche)).toMatchObject({ estado: "a_tiempo", diferencia: 7.5 * H });
  });

  it("en espera el reloj se detiene donde quedó", () => {
    const p = plazo(t("urgente", { estado: "en_espera", pausadoDesde: new Date(base.getTime() + H) }), new Date(base.getTime() + 50 * H));
    expect(p).toMatchObject({ estado: "pausado", diferencia: 3 * H });
    expect(textoPlazo(p)).toBe("En pausa, quedan 3 h hábiles");
  });

  it("una vez resuelto se compara con la hora de resolución", () => {
    const ahora = new Date(base.getTime() + 100 * H);
    expect(plazo(t("urgente", { estado: "resuelto", resueltoEn: new Date(base.getTime() + 3 * H) }), ahora).estado).toBe("cumplido");
    expect(plazo(t("urgente", { estado: "resuelto", resueltoEn: new Date(base.getTime() + 6 * H) }), ahora)).toMatchObject({
      estado: "incumplido",
      diferencia: -2 * H,
    });
    expect(plazo(t("urgente", { estado: "cerrado" }), ahora).estado).toBe("sin_plazo");
  });

  it("escribe las duraciones en horas", () => {
    expect(duracion(15 * 60_000)).toBe("15 min");
    expect(duracion(3 * H + 20 * 60_000)).toBe("3 h 20 min");
    expect(duracion(-5 * H)).toBe("5 h");
    expect(duracion(21 * H + 11 * 60_000)).toBe("21 h");
    expect(duracion(52 * H)).toBe("52 h");
    expect(textoPlazo({ estado: "a_tiempo", diferencia: 40 * 60_000, usado: 0 })).toBe("Quedan 40 min");
    expect(textoPlazo({ estado: "vencido", diferencia: -2 * H, usado: 1 })).toBe("Vencido hace 2 h hábiles");
    expect(textoPlazo({ estado: "incumplido", diferencia: -2 * H, usado: 1 })).toBe("Resuelto 2 h hábiles fuera de plazo");
  });
});

describe("códigos de inventario", () => {
  it("sigue al mayor número del mismo tipo", () => {
    expect(siguienteCodigo("notebook", [])).toBe("NB-0001");
    expect(siguienteCodigo("notebook", ["NB-0001", "NB-0009", "PC-0040", "NB-0003"])).toBe("NB-0010");
    expect(siguienteCodigo("impresora", ["IMP-0002", "IMPX-0099"])).toBe("IMP-0003");
  });
});

describe("asignación automática", () => {
  const todos = ["Camila Rojas", "Diego Fuentes", "Valentina Soto"];
  const carga = new Map([
    ["Camila Rojas", 5],
    ["Diego Fuentes", 2],
    ["Valentina Soto", 2],
  ]);
  it("cola: no asigna", () => {
    expect(elegirTecnico({ modo: "cola", tecnico: null }, todos, carga)).toBeNull();
  });
  it("especialista, si está disponible", () => {
    expect(elegirTecnico({ modo: "tecnico", tecnico: "Camila Rojas" }, todos, carga)).toBe("Camila Rojas");
  });
  it("si el especialista no está, al de menos carga (empate: el primero de la lista)", () => {
    expect(elegirTecnico({ modo: "tecnico", tecnico: "Camila Rojas" }, ["Diego Fuentes", "Valentina Soto"], carga)).toBe("Diego Fuentes");
    expect(elegirTecnico({ modo: "menos_carga", tecnico: null }, todos, carga)).toBe("Diego Fuentes");
    expect(elegirTecnico({ modo: "menos_carga", tecnico: null }, ["Camila Rojas", "Valentina Soto"], carga)).toBe("Valentina Soto");
  });
  it("sin nadie disponible queda en la cola", () => {
    expect(elegirTecnico({ modo: "menos_carga", tecnico: null }, [], carga)).toBeNull();
  });
});
