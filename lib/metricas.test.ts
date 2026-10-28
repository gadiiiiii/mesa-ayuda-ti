import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { cambiarEstado, comentar, crearSolicitud, vaciar } from "./datos";
import { conectarPGlite, migrar, type BD } from "./db";
import { aCSV, cargarDatos, calcularMetricas, metricas, obtenerEncuesta, responderEncuesta } from "./metricas";
import { sembrar } from "./semilla";
import { esquemaSolicitud } from "./validacion";

// Lunes 26 de octubre de 2026, 9:00 en Chile.
const t0 = new Date("2026-10-26T12:00:00Z");
const despues = (h: number) => new Date(t0.getTime() + h * 3_600_000);

let bd: BD;
beforeAll(async () => {
  bd = await conectarPGlite();
  await migrar(bd);
});
beforeEach(() => vaciar(bd));

async function solicitud(categoria = "impresoras", prioridad = "alta") {
  const r = await crearSolicitud(
    bd,
    esquemaSolicitud.parse({
      solicitante: "Ana Pérez",
      unidad: "Tránsito",
      categoria,
      prioridad,
      titulo: "La impresora no imprime",
      descripcion: "Los documentos quedan en la cola.",
    }),
    t0,
  );
  if (!r.ok) throw new Error(r.error);
  return r.valor.id;
}

describe("métricas", () => {
  it("mide primera respuesta y resolución en horas hábiles, sin la espera", async () => {
    const a = await solicitud();
    await cambiarEstado(bd, a, "en_curso", null, "Diego Fuentes", despues(1)); // primera respuesta: 1 h
    await cambiarEstado(bd, a, "en_espera", "Repuesto.", "Diego Fuentes", despues(2));
    await cambiarEstado(bd, a, "en_curso", null, "Diego Fuentes", despues(4)); // 2 h en espera
    await cambiarEstado(bd, a, "resuelto", "Listo.", "Diego Fuentes", despues(5)); // 5 h − 2 h = 3 h

    const b = await solicitud("red", "urgente");
    await comentar(bd, b, "Nota interna", "Camila Rojas", despues(0.5)); // no cuenta: no es visible
    await comentar(bd, b, "Voy para allá", "Camila Rojas", despues(2), true); // primera respuesta: 2 h
    await cambiarEstado(bd, b, "resuelto", "Listo.", "Camila Rojas", despues(6)); // 6 h > 4 h: fuera de plazo

    await responderEncuesta(bd, a, 5, null, despues(7));
    await responderEncuesta(bd, b, 2, "Tardaron.", despues(7));

    const m = calcularMetricas(await cargarDatos(bd, t0, despues(24)), t0, despues(24));
    expect(m.total).toMatchObject({
      recibidos: 2,
      resueltos: 2,
      enPlazo: 50,
      horasResolucion: 4.5,
      horasPrimeraRespuesta: 1.5,
      satisfaccion: 3.5,
      encuestas: 2,
      satisfechos: 50,
    });
    expect(m.porTecnico.find((t) => t.tecnico === "Diego Fuentes")).toMatchObject({ resueltos: 1, horasResolucion: 3, satisfaccion: 5 });
    expect(m.porCategoria.map((c) => c.categoria)).toEqual(["red", "impresoras"]);
    expect(m.porSemana).toEqual([{ inicio: "2026-10-26", recibidos: 2, resueltos: 2 }]);
    expect(m.comentarios.map((c) => c.comentario)).toEqual(["Tardaron."]);
  });

  it("la encuesta se responde una vez y solo si está resuelto", async () => {
    const a = await solicitud();
    expect((await responderEncuesta(bd, a, 5, null, despues(1))).ok).toBe(false);
    await cambiarEstado(bd, a, "resuelto", "Listo.", "Diego Fuentes", despues(1));
    expect((await responderEncuesta(bd, a, 6, null, despues(2))).ok).toBe(false);
    expect((await responderEncuesta(bd, a, 4, "Bien", despues(2))).ok).toBe(true);
    expect((await responderEncuesta(bd, a, 1, null, despues(3))).ok).toBe(false);
    expect((await obtenerEncuesta(bd, a))?.nota).toBe(4);
  });

  it("exporta un CSV que Excel en Chile abre bien", async () => {
    const a = await solicitud();
    await cambiarEstado(bd, a, "resuelto", "Listo; con punto y coma.", "Diego Fuentes", despues(1.5));
    const csv = aCSV(await cargarDatos(bd, t0, despues(24)));
    expect(csv.startsWith("﻿Folio;Título;Categoría")).toBe(true);
    expect(csv).toContain(`${a};La impresora no imprime;Impresoras;Alta;Resuelto;;Ana Pérez;Tránsito;Portal;2026-10-26 09:00;`);
    expect(csv).toContain(";1,5;Sí;");
  });

  it("con los datos de ejemplo da números razonables", async () => {
    const ahora = new Date("2026-10-28T15:00:00Z");
    await sembrar(bd, ahora);
    const m = await metricas(bd, 30, ahora);
    expect(m.total.recibidos).toBeGreaterThan(60);
    expect(m.total.enPlazo).toBeGreaterThan(60);
    expect(m.total.satisfaccion).toBeGreaterThan(3.5);
    expect(m.porSemana.length).toBeGreaterThanOrEqual(5);
  });
});
