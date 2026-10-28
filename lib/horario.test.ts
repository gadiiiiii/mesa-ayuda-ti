import { describe, expect, it } from "vitest";
import { aLocal, desdeLocal, habilesEntre, proximoHabil, sumarHabiles } from "./horario";

const H = 3_600_000;
const local = (s: string) => {
  const [f, h] = s.split(" ");
  const [hh, mm] = h.split(":").map(Number);
  return desdeLocal(f, (hh * 60 + mm) * 60_000);
};
const ver = (d: Date) => {
  const l = aLocal(d);
  const min = Math.round(l.ms / 60_000);
  return `${l.fecha} ${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
};

describe("hora de Chile", () => {
  it("convierte ida y vuelta, en invierno y en verano", () => {
    expect(local("2026-10-28 09:00").toISOString()).toBe("2026-10-28T12:00:00.000Z"); // UTC−3
    expect(local("2026-07-15 09:00").toISOString()).toBe("2026-07-15T13:00:00.000Z"); // UTC−4
    expect(ver(new Date("2026-10-28T20:15:00Z"))).toBe("2026-10-28 17:15");
  });
});

describe("sumarHabiles", () => {
  it("dentro del mismo día", () => {
    expect(ver(sumarHabiles(local("2026-10-28 09:00"), 4 * H))).toBe("2026-10-28 13:00");
  });
  it("pasa al día siguiente al cerrar la oficina", () => {
    expect(ver(sumarHabiles(local("2026-10-28 16:00"), 4 * H))).toBe("2026-10-29 11:00");
  });
  it("el viernes cierra a las 16:30 y salta el fin de semana", () => {
    expect(ver(sumarHabiles(local("2026-10-23 15:30"), 4 * H))).toBe("2026-10-26 11:30");
  });
  it("salta feriados, como Navidad", () => {
    expect(ver(sumarHabiles(local("2026-12-24 16:30"), 2 * H))).toBe("2026-12-28 09:30");
  });
  it("si se crea fuera de horario, el plazo parte al abrir", () => {
    expect(ver(sumarHabiles(local("2026-10-28 20:00"), 1 * H))).toBe("2026-10-29 09:30");
    expect(ver(sumarHabiles(local("2026-10-31 11:00"), 1 * H))).toBe("2026-11-02 09:30");
  });
  it("una semana hábil son 44 horas", () => {
    expect(ver(sumarHabiles(local("2026-10-26 08:30"), 44 * H))).toBe("2026-10-30 16:30");
  });
});

describe("habilesEntre", () => {
  it("cuenta solo el horario de atención", () => {
    expect(habilesEntre(local("2026-10-28 09:00"), local("2026-10-28 11:30"))).toBe(2.5 * H);
    expect(habilesEntre(local("2026-10-28 16:00"), local("2026-10-29 11:00"))).toBe(4 * H);
    expect(habilesEntre(local("2026-10-30 16:00"), local("2026-11-02 09:00"))).toBe(1 * H);
    expect(habilesEntre(local("2026-10-28 20:00"), local("2026-10-28 23:00"))).toBe(0);
  });
  it("es negativo si el orden se invierte", () => {
    expect(habilesEntre(local("2026-10-29 11:00"), local("2026-10-28 16:00"))).toBe(-4 * H);
  });
  it("es el inverso de sumarHabiles", () => {
    const a = local("2026-09-15 10:17");
    for (const h of [0.5, 3, 9, 17, 40, 120]) expect(habilesEntre(a, sumarHabiles(a, h * H))).toBe(h * H);
  });
});

describe("proximoHabil", () => {
  it("devuelve el mismo instante en horario y la próxima apertura fuera de él", () => {
    expect(ver(proximoHabil(local("2026-10-28 10:00")))).toBe("2026-10-28 10:00");
    expect(ver(proximoHabil(local("2026-10-30 17:00")))).toBe("2026-11-02 08:30");
  });
});
