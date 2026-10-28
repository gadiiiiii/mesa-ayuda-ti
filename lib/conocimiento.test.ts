import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { aplicarPlantilla, bloques, buscarArticulos, listarRespuestas, obtenerArticulo, votarArticulo } from "./conocimiento";
import { sembrarConocimiento } from "./conocimientoSemilla";
import { vaciar } from "./datos";
import { conectarPGlite, migrar, type BD } from "./db";

let bd: BD;
beforeAll(async () => {
  bd = await conectarPGlite();
  await migrar(bd);
});
beforeEach(async () => {
  await vaciar(bd);
  await sembrarConocimiento(bd, new Date("2026-10-28T12:00:00Z"));
});

describe("búsqueda en la base de conocimiento", () => {
  it("encuentra por la raíz de la palabra y ordena por relevancia", async () => {
    const r = await buscarArticulos(bd, { q: "impresoras" });
    expect(r[0].titulo).toBe("La impresora no imprime: reiniciar la cola de impresión");
  });
  it("una frase larga encuentra artículos aunque no tengan todas las palabras", async () => {
    const r = await buscarArticulos(bd, { q: "No me llegan los correos al Outlook desde ayer" });
    expect(r[0].titulo).toBe("Outlook no recibe correos");
  });
  it("encuentra mientras se escribe una palabra a medias (por el título)", async () => {
    expect((await buscarArticulos(bd, { q: "contrase" })).map((a) => a.titulo)).toContain("Cambiar tu contraseña del computador");
  });
  it("el portal solo ve los públicos", async () => {
    const todos = await buscarArticulos(bd, { q: "teléfono anexo sin tono" });
    const publicos = await buscarArticulos(bd, { q: "teléfono anexo sin tono", soloPublicos: true });
    expect(todos.some((a) => !a.publico)).toBe(true);
    expect(publicos.every((a) => a.publico)).toBe(true);
  });
  it("filtra por categoría y lista todo sin búsqueda", async () => {
    expect((await buscarArticulos(bd, { categoria: "red" })).length).toBe(2);
    expect((await buscarArticulos(bd)).length).toBe(7);
  });
  it("cuenta si sirvió, solo en artículos públicos", async () => {
    const [publico] = await buscarArticulos(bd, { q: "wifi" });
    const antes = publico.utiles;
    expect((await votarArticulo(bd, publico.id, true)).ok).toBe(true);
    expect((await obtenerArticulo(bd, publico.id))!.utiles).toBe(antes + 1);
    const interno = (await buscarArticulos(bd)).find((a) => !a.publico)!;
    expect((await votarArticulo(bd, interno.id, true)).ok).toBe(false);
  });
});

describe("respuestas predefinidas", () => {
  it("se cargan y completan los datos del ticket", async () => {
    const [r] = (await listarRespuestas(bd)).filter((x) => x.titulo === "Pedir más información");
    expect(aplicarPlantilla(r.texto, { solicitante: "Ana Pérez", tecnico: "Diego Fuentes", folio: 42 })).toMatch(
      /^Hola Ana: .* solicitud #42 /,
    );
  });
});

describe("texto de los artículos", () => {
  it("separa párrafos y listas", () => {
    expect(bloques("Intro\nsigue.\n\n1. Uno\n2. Dos\n\n- a\n- b")).toEqual([
      { tipo: "parrafo", texto: "Intro sigue." },
      { tipo: "numerada", items: ["Uno", "Dos"] },
      { tipo: "vinetas", items: ["a", "b"] },
    ]);
  });
});
