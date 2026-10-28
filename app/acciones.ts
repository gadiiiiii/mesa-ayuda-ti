"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actualizarAsignacion,
  actualizarEquipo,
  cambiarEstado,
  comentar,
  crearEquipo,
  crearSolicitud,
  crearTicket,
  guardarReglas,
  responderSolicitante,
  vaciar,
} from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { CATEGORIAS, MODOS_ASIGNACION, esTecnico, type Categoria, type ModoAsignacion, type Regla } from "@/lib/dominio";
import { normalizarCodigo } from "@/lib/codigo";
import {
  actualizarArticulo,
  crearArticulo,
  eliminarArticulo,
  eliminarRespuesta,
  guardarRespuesta,
  obtenerArticulo,
  votarArticulo,
} from "@/lib/conocimiento";
import { crearProblema, marcarDuplicado, resolverProblema, vincularProblema } from "@/lib/relacionados";
import { sembrar } from "@/lib/semilla";
import {
  erroresPorCampo,
  esquemaArticulo,
  esquemaAsignacion,
  esquemaCambioEstado,
  esquemaComentario,
  esquemaEquipo,
  esquemaFolio,
  esquemaProblema,
  esquemaResolverProblema,
  esquemaRespuesta,
  esquemaSolicitud,
  esquemaTicketNuevo,
  valores,
} from "@/lib/validacion";
import { COOKIE_TECNICO, tecnicoActual } from "./sesion";

/** Lo que devuelve una acción de formulario a `useActionState`. */
export type EstadoFormulario = {
  /** Cambia en cada envío correcto, para que el formulario se limpie o avise. */
  ok?: number;
  mensaje?: string;
  errores?: Record<string, string>;
  /** Lo que se escribió, para no perderlo si hubo errores. */
  valores?: Record<string, string>;
  /** Cambia en cada envío con errores: el formulario se vuelve a montar con lo escrito. */
  intento?: number;
};

const idDe = (form: FormData) => {
  const id = Number(form.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function elegirTecnico(form: FormData) {
  const nombre = form.get("tecnico");
  if (!esTecnico(nombre)) return;
  (await cookies()).set(COOKIE_TECNICO, encodeURIComponent(nombre), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function accionCrearTicket(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const datos = valores(form);
  const v = esquemaTicketNuevo.safeParse(datos);
  if (!v.success) return { errores: erroresPorCampo(v.error), valores: datos, mensaje: "Revisa los campos marcados.", intento: Date.now() };
  const r = await crearTicket(await obtenerBD(), v.data, await tecnicoActual(), new Date());
  if (!r.ok) return { mensaje: r.error, valores: datos, intento: Date.now() };
  revalidatePath("/", "layout");
  redirect(`/tickets/${r.valor}?creado=1`);
}

export async function accionCambiarEstado(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const id = idDe(form);
  const v = esquemaCambioEstado.safeParse(valores(form));
  if (!id || !v.success) return { mensaje: "Datos no válidos. Recarga la página." };
  const r = await cambiarEstado(await obtenerBD(), id, v.data.hacia, v.data.nota, await tecnicoActual(), new Date());
  if (!r.ok) return { mensaje: r.error, valores: valores(form) };
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function accionComentar(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const id = idDe(form);
  const v = esquemaComentario.safeParse(valores(form));
  if (!id) return { mensaje: "Datos no válidos. Recarga la página." };
  if (!v.success) return { errores: erroresPorCampo(v.error), valores: valores(form) };
  const r = await comentar(await obtenerBD(), id, v.data.texto, await tecnicoActual(), new Date(), v.data.publico);
  if (!r.ok) return { mensaje: r.error };
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

export async function accionAsignar(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const id = idDe(form);
  const v = esquemaAsignacion.safeParse(valores(form));
  if (!id || !v.success) return { mensaje: "Datos no válidos. Recarga la página." };
  const r = await actualizarAsignacion(await obtenerBD(), id, v.data, await tecnicoActual(), new Date());
  if (!r.ok) return { mensaje: r.error };
  revalidatePath("/", "layout");
  return { ok: Date.now(), mensaje: r.valor.cambios ? "Cambios guardados." : "No había cambios." };
}

export async function accionGuardarEquipo(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const datos = valores(form);
  const id = idDe(form);
  const v = esquemaEquipo.safeParse(datos);
  if (!v.success) return { errores: erroresPorCampo(v.error), valores: datos, mensaje: "Revisa los campos marcados.", intento: Date.now() };
  const bd = await obtenerBD();
  const ahora = new Date();
  let destino: number;
  if (id) {
    const { tipo: _tipo, ...resto } = v.data;
    const r = await actualizarEquipo(bd, id, resto, ahora);
    if (!r.ok) return { mensaje: r.error, valores: datos, intento: Date.now() };
    destino = id;
  } else {
    const r = await crearEquipo(bd, v.data, ahora);
    if (!r.ok) return { mensaje: r.error, valores: datos, intento: Date.now() };
    destino = r.valor;
  }
  revalidatePath("/", "layout");
  redirect(`/inventario/${destino}?${id ? "guardado" : "creado"}=1`);
}

export async function accionRestablecer(): Promise<EstadoFormulario> {
  const bd = await obtenerBD();
  await vaciar(bd);
  await sembrar(bd, new Date());
  revalidatePath("/", "layout");
  return { ok: Date.now(), mensaje: "Se restablecieron los datos de ejemplo." };
}

// ── Portal ─────────────────────────────────────────────────────────────────

export async function accionCrearSolicitud(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const datos = valores(form);
  const v = esquemaSolicitud.safeParse(datos);
  if (!v.success) return { errores: erroresPorCampo(v.error), valores: datos, mensaje: "Revisa los campos marcados.", intento: Date.now() };
  const r = await crearSolicitud(await obtenerBD(), v.data, new Date());
  if (!r.ok) return { errores: { codigoEquipo: r.error }, valores: datos, mensaje: "Revisa los campos marcados.", intento: Date.now() };
  revalidatePath("/", "layout");
  redirect(`/portal/seguimiento/${r.valor.codigo}?nueva=1`);
}

export async function accionResponderSolicitante(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const codigo = normalizarCodigo(String(form.get("codigo") ?? ""));
  const v = esquemaComentario.safeParse(valores(form));
  if (!codigo) return { mensaje: "Datos no válidos. Recarga la página." };
  if (!v.success) return { errores: { texto: erroresPorCampo(v.error).texto }, valores: valores(form) };
  const r = await responderSolicitante(await obtenerBD(), codigo, v.data.texto, form.get("reabrir") === "on", new Date());
  if (!r.ok) return { mensaje: r.error, valores: valores(form) };
  revalidatePath("/", "layout");
  return { ok: Date.now(), mensaje: r.valor.reabierto ? "Reabrimos tu solicitud." : "Mensaje enviado." };
}

// ── Asignación automática ──────────────────────────────────────────────────

export async function accionGuardarReglas(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const reglas = {} as Record<Categoria, Regla>;
  for (const c of CATEGORIAS) {
    const valor = String(form.get(`regla-${c}`) ?? "cola");
    const [modo, tecnico] = valor.split(":") as [ModoAsignacion, string | undefined];
    if (!MODOS_ASIGNACION.includes(modo) || (modo === "tecnico" && !esTecnico(tecnico)))
      return { mensaje: "Regla no válida. Recarga la página." };
    reglas[c] = { modo, tecnico: modo === "tecnico" ? tecnico! : null };
  }
  const disponibles = form.getAll("disponible").filter(esTecnico);
  await guardarReglas(await obtenerBD(), reglas, disponibles);
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

// ── Tickets relacionados ───────────────────────────────────────────────────

export async function accionMarcarDuplicado(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const id = idDe(form);
  const folio = esquemaFolio.safeParse(form.get("folio") ?? "");
  if (!id) return { mensaje: "Datos no válidos. Recarga la página." };
  if (!folio.success) return { errores: { folio: folio.error.issues[0].message }, valores: valores(form) };
  const r = await marcarDuplicado(await obtenerBD(), id, folio.data, await tecnicoActual(), new Date());
  if (!r.ok) return { errores: { folio: r.error }, valores: valores(form) };
  revalidatePath("/", "layout");
  return { ok: Date.now(), mensaje: `Cerrado como duplicado del #${r.valor}.` };
}

export async function accionVincularProblema(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const id = idDe(form);
  const valor = String(form.get("problema") ?? "");
  const problemaId = valor === "" ? null : Number(valor);
  if (!id || (problemaId !== null && !Number.isInteger(problemaId))) return { mensaje: "Datos no válidos. Recarga la página." };
  const r = await vincularProblema(await obtenerBD(), id, problemaId, await tecnicoActual(), new Date());
  if (!r.ok) return { mensaje: r.error };
  revalidatePath("/", "layout");
  return { ok: Date.now(), mensaje: problemaId ? "Vinculado al problema." : "Se quitó del problema." };
}

export async function accionCrearProblema(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const datos = valores(form);
  const v = esquemaProblema.safeParse(datos);
  if (!v.success) return { errores: erroresPorCampo(v.error), valores: datos, intento: Date.now() };
  const ticketId = idDe(form) ?? undefined;
  const r = await crearProblema(await obtenerBD(), v.data, await tecnicoActual(), new Date(), ticketId);
  if (!r.ok) return { mensaje: r.error, valores: datos, intento: Date.now() };
  revalidatePath("/", "layout");
  redirect(`/problemas/${r.valor}`);
}

/** Agrega un ticket (por folio) a un problema desde la ficha del problema. */
export async function accionAgregarAProblema(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const problemaId = Number(form.get("problemaId"));
  const folio = esquemaFolio.safeParse(form.get("folio") ?? "");
  if (!Number.isInteger(problemaId)) return { mensaje: "Datos no válidos. Recarga la página." };
  if (!folio.success) return { errores: { folio: folio.error.issues[0].message }, valores: valores(form) };
  const r = await vincularProblema(await obtenerBD(), folio.data, problemaId, await tecnicoActual(), new Date());
  if (!r.ok) return { errores: { folio: r.error }, valores: valores(form) };
  revalidatePath("/", "layout");
  return { ok: Date.now(), mensaje: `Se agregó el ticket #${folio.data}.` };
}

export async function accionResolverProblema(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const id = idDe(form);
  const datos = valores(form);
  const v = esquemaResolverProblema.safeParse(datos);
  if (!id) return { mensaje: "Datos no válidos. Recarga la página." };
  if (!v.success) return { errores: erroresPorCampo(v.error), valores: datos };
  const r = await resolverProblema(await obtenerBD(), id, v.data, await tecnicoActual(), new Date());
  if (!r.ok) return { mensaje: r.error, valores: datos };
  revalidatePath("/", "layout");
  const n = r.valor.ticketsResueltos;
  return { ok: Date.now(), mensaje: n ? `Problema resuelto, junto con ${n === 1 ? "1 ticket" : `${n} tickets`}.` : "Problema resuelto." };
}

// ── Base de conocimiento ───────────────────────────────────────────────────

export async function accionGuardarArticulo(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const datos = valores(form);
  const v = esquemaArticulo.safeParse(datos);
  if (!v.success) return { errores: erroresPorCampo(v.error), valores: datos, mensaje: "Revisa los campos marcados.", intento: Date.now() };
  const bd = await obtenerBD();
  const id = idDe(form);
  let destino: number;
  if (id) {
    const r = await actualizarArticulo(bd, id, v.data, new Date());
    if (!r.ok) return { mensaje: r.error, valores: datos, intento: Date.now() };
    destino = id;
  } else {
    const ticketId = Number(form.get("ticketId")) || null;
    destino = await crearArticulo(bd, { ...v.data, ticketId }, await tecnicoActual(), new Date());
  }
  revalidatePath("/", "layout");
  redirect(`/conocimiento/${destino}`);
}

export async function accionEliminarArticulo(form: FormData) {
  const id = idDe(form);
  if (id) await eliminarArticulo(await obtenerBD(), id);
  revalidatePath("/", "layout");
  redirect("/conocimiento");
}

export async function accionVotarArticulo(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const id = idDe(form);
  if (!id) return { mensaje: "Datos no válidos." };
  const r = await votarArticulo(await obtenerBD(), id, form.get("util") === "si");
  if (!r.ok) return { mensaje: r.error };
  revalidatePath("/", "layout");
  return {
    ok: Date.now(),
    mensaje: form.get("util") === "si" ? "Gracias. Nos alegra que te sirviera." : "Gracias. Si necesitas ayuda, pídela en el portal.",
  };
}

/** Comparte un artículo público con el solicitante de un ticket, como respuesta visible en el portal. */
export async function accionEnviarArticulo(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const id = idDe(form);
  const articuloId = Number(form.get("articulo"));
  if (!id || !Number.isInteger(articuloId)) return { mensaje: "Datos no válidos. Recarga la página." };
  const bd = await obtenerBD();
  const a = await obtenerArticulo(bd, articuloId);
  if (!a?.publico) return { mensaje: "Ese artículo no es público." };
  const r = await comentar(
    bd,
    id,
    `Te puede servir este artículo: «${a.titulo}». /portal/ayuda/${a.id}`,
    await tecnicoActual(),
    new Date(),
    true,
  );
  if (!r.ok) return { mensaje: r.error };
  revalidatePath("/", "layout");
  return { ok: Date.now(), mensaje: "Artículo enviado al solicitante." };
}

export async function accionGuardarRespuesta(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const datos = valores(form);
  const v = esquemaRespuesta.safeParse(datos);
  if (!v.success) return { errores: erroresPorCampo(v.error), valores: datos };
  await guardarRespuesta(await obtenerBD(), { id: idDe(form), ...v.data });
  revalidatePath("/", "layout");
  return { ok: Date.now(), mensaje: "Respuesta guardada." };
}

export async function accionEliminarRespuesta(form: FormData) {
  const id = idDe(form);
  if (id) await eliminarRespuesta(await obtenerBD(), id);
  revalidatePath("/", "layout");
}
