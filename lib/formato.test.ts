import { describe, expect, it } from "vitest";
import { formatearConDia, formatearFecha, formatearFechaHora, hace } from "./formato";

describe("formato", () => {
  it("muestra la hora de Chile aunque la fecha venga en UTC", () => {
    // 17:05 UTC = 14:05 en Chile (horario de verano, UTC−3).
    expect(formatearFechaHora(new Date("2026-10-28T17:05:00Z"), new Date("2026-10-29T00:00:00Z"))).toBe("28 oct 14:05");
    expect(formatearFechaHora(new Date("2025-03-02T15:00:00Z"), new Date("2026-10-29T00:00:00Z"))).toBe("2 mar 2025 12:00");
  });
  it("con el día de la semana", () => {
    expect(formatearConDia(new Date("2026-10-29T12:00:00Z"))).toBe("jue 29 oct 09:00");
  });
  it("fechas sin hora y tiempo transcurrido", () => {
    expect(formatearFecha("2023-03-12")).toBe("12 de marzo de 2023");
    const a = new Date("2026-10-28T12:00:00Z");
    expect(hace(new Date(a.getTime() - 30_000), a)).toBe("recién");
    expect(hace(new Date(a.getTime() - 3 * 3_600_000), a)).toBe("hace 3 h");
    expect(hace(new Date(a.getTime() - 50 * 3_600_000), a)).toBe("hace 2 d");
  });
});
