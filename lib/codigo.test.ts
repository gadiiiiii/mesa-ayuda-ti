import { describe, expect, it } from "vitest";
import { normalizarCodigo, nuevoCodigo } from "./codigo";

describe("códigos de seguimiento", () => {
  it("tienen la forma ABCD-2345 y no usan caracteres confusos", () => {
    for (let i = 0; i < 500; i++) {
      const c = nuevoCodigo();
      expect(c).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(c).not.toMatch(/[01OIL]/);
    }
  });
  it("se aceptan como los escriba la persona", () => {
    expect(normalizarCodigo(" k7m2 qx9p ")).toBe("K7M2-QX9P");
    expect(normalizarCodigo("k7m2-qx9p")).toBe("K7M2-QX9P");
    expect(normalizarCodigo("K7M2QX9")).toBeNull();
  });
});
