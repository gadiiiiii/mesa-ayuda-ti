import { describe, expect, it } from "vitest";
import { claveIPv4, normalizarIPv4, normalizarMAC } from "./red";

describe("IPv4", () => {
  it("acepta y normaliza", () => {
    expect(normalizarIPv4(" 192.168.010.025 ")).toBe("192.168.10.25");
    expect(normalizarIPv4("0.0.0.0")).toBe("0.0.0.0");
  });
  it("rechaza lo que no es IPv4", () => {
    for (const x of ["192.168.1", "256.1.1.1", "1.2.3.4.5", "a.b.c.d", "192.168.1.1/24", "1..2.3", ""])
      expect(normalizarIPv4(x)).toBeNull();
  });
  it("ordena como número", () => {
    expect(claveIPv4("10.0.0.9")).toBeLessThan(claveIPv4("10.0.0.10"));
  });
});

describe("MAC", () => {
  it("acepta los formatos comunes", () => {
    expect(normalizarMAC("00:1a:2b:3c:4d:5e")).toBe("00:1A:2B:3C:4D:5E");
    expect(normalizarMAC("00-1A-2B-3C-4D-5E")).toBe("00:1A:2B:3C:4D:5E");
    expect(normalizarMAC("001a.2b3c.4d5e")).toBe("00:1A:2B:3C:4D:5E");
    expect(normalizarMAC("001A2B3C4D5E")).toBe("00:1A:2B:3C:4D:5E");
  });
  it("rechaza las mal escritas", () => {
    for (const x of ["00:1A:2B:3C:4D", "00:1A:2B:3C:4D:5G", "001a.2b3c", "00:1A-2B:3C:4D:5E"]) expect(normalizarMAC(x)).toBeNull();
  });
});
