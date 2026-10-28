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
  responderSolicitante,
  vaciar,
} from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { esTecnico } from "@/lib/dominio";
import { normalizarCodigo } from "@/lib/codigo";
import { sembrar } from "@/lib/semilla";
import {
  erroresPorCampo,
  esquemaAsignacion,
  esquemaCambioEstado,
  esquemaComentario,
  esquemaEquipo,
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
