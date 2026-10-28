import { describe, expect, it } from "vitest";
import { erroresPorCampo, esquemaEquipo, esquemaTicketNuevo } from "./validacion";

const ticket = {
  titulo: "La impresora no imprime",
  descripcion: "Los documentos quedan en la cola.",
  solicitante: "Ana Pérez",
  unidad: "Tránsito",
  categoria: "impresoras",
  prioridad: "media",
  equipoId: "",
};

describe("ticket nuevo", () => {
  it("acepta un ticket completo y deja el equipo en null si no se eligió", () => {
    const r = esquemaTicketNuevo.parse(ticket);
    expect(r.equipoId).toBeNull();
    expect(esquemaTicketNuevo.parse({ ...ticket, equipoId: "12" }).equipoId).toBe(12);
  });
  it("explica cada error en su campo", () => {
    const r = esquemaTicketNuevo.safeParse({ ...ticket, titulo: "  ", descripcion: "corta", unidad: "Marte" });
    expect(r.success).toBe(false);
    const e = erroresPorCampo(r.error!);
    expect(e.titulo).toBe("Falta el título.");
    expect(e.descripcion).toBe("Escribe al menos 10 caracteres.");
    expect(e.unidad).toBe("Elige la unidad.");
  });
});

describe("equipo", () => {
  const equipo = { tipo: "impresora", marca: "HP", modelo: "M404dn", unidad: "Tránsito", estado: "en_uso" };
  it("normaliza IP y MAC y vacía lo opcional", () => {
    const r = esquemaEquipo.parse({ ...equipo, ip: "192.168.010.5", mac: "001a.2b3c.4d5e", serie: " ", fechaCompra: "" });
    expect(r).toMatchObject({ ip: "192.168.10.5", mac: "00:1A:2B:3C:4D:5E", serie: null, fechaCompra: null, responsable: null });
  });
  it("rechaza IP, MAC y fecha mal escritas", () => {
    const r = esquemaEquipo.safeParse({ ...equipo, ip: "192.168.1.300", mac: "xx", fechaCompra: "28/10/2026" });
    const e = erroresPorCampo(r.error!);
    expect(Object.keys(e).sort()).toEqual(["fechaCompra", "ip", "mac"]);
  });
});
