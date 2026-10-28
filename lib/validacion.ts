import { z } from "zod";
import { CATEGORIAS, ESTADOS, ESTADOS_EQUIPO, PRIORIDADES, TECNICOS, TIPOS_EQUIPO, UNIDADES } from "./dominio";
import { normalizarIPv4, normalizarMAC } from "./red";

/** Texto de un formulario: sin espacios a los lados y, si queda vacío, null. */
const opcional = z
  .string()
  .optional()
  .transform((s) => (s?.trim() ? s.trim() : null));

const obligatorio = (nombre: string, min: number, max: number) =>
  z
    .string({ error: `Falta ${nombre}.` })
    .trim()
    .min(1, `Falta ${nombre}.`)
    .min(min, `Escribe al menos ${min} caracteres.`)
    .max(max, `Máximo ${max} caracteres.`);

const opcion = <T extends readonly [string, ...string[]]>(lista: T, mensaje: string) => z.enum(lista, { error: mensaje });

export const esquemaTicketNuevo = z.object({
  titulo: obligatorio("el título", 5, 120),
  descripcion: obligatorio("la descripción", 10, 4000),
  solicitante: obligatorio("el nombre de quien pide ayuda", 3, 80),
  unidad: opcion(UNIDADES, "Elige la unidad."),
  categoria: opcion(CATEGORIAS, "Elige una categoría."),
  prioridad: opcion(PRIORIDADES, "Elige la prioridad."),
  equipoId: opcional.pipe(z.string().regex(/^\d+$/, "Equipo no válido.").transform(Number).nullable()),
});
export type TicketNuevo = z.infer<typeof esquemaTicketNuevo>;

export const esquemaCambioEstado = z.object({
  hacia: opcion(ESTADOS, "Estado no válido."),
  nota: opcional,
});

export const esquemaComentario = z.object({
  texto: obligatorio("el comentario", 2, 4000),
  /** "on" si es una respuesta que ve el solicitante; si no, es una nota interna. */
  publico: z
    .string()
    .optional()
    .transform((s) => s === "on" || s === "true"),
});

/** Lo que llena un funcionario en el portal. La prioridad sale del impacto. */
export const esquemaSolicitud = z.object({
  solicitante: obligatorio("tu nombre", 3, 80),
  unidad: opcion(UNIDADES, "Elige tu unidad."),
  categoria: opcion(CATEGORIAS, "Elige de qué se trata."),
  prioridad: opcion(PRIORIDADES, "Elige cuánto te afecta."),
  titulo: obligatorio("qué pasa", 5, 120),
  descripcion: obligatorio("el detalle", 10, 4000),
  codigoEquipo: opcional.pipe(
    z
      .string()
      .transform((s) => s.toUpperCase().replace(/\s/g, ""))
      .pipe(z.string().regex(/^[A-Z]{2,3}-?\d{1,4}$/, "Escríbelo como en la etiqueta, por ejemplo NB-0007."))
      .transform((s) => {
        const [, p, n] = /^([A-Z]+)-?(\d+)$/.exec(s)!;
        return `${p}-${n.padStart(4, "0")}`;
      })
      .nullable(),
  ),
});
export type Solicitud = z.infer<typeof esquemaSolicitud>;

export const esquemaAsignacion = z.object({
  tecnico: opcional.pipe(z.enum(TECNICOS, { error: "Técnico no válido." }).nullable()),
  prioridad: opcion(PRIORIDADES, "Elige la prioridad."),
});

const fecha = opcional.pipe(
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato AAAA-MM-DD.")
    .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha no válida.")
    .nullable(),
);

export const esquemaEquipo = z.object({
  tipo: opcion(TIPOS_EQUIPO, "Elige el tipo de equipo."),
  marca: obligatorio("la marca", 2, 40),
  modelo: obligatorio("el modelo", 1, 60),
  serie: opcional.pipe(z.string().max(60, "Máximo 60 caracteres.").nullable()),
  unidad: opcion(UNIDADES, "Elige la unidad."),
  responsable: opcional.pipe(z.string().max(80, "Máximo 80 caracteres.").nullable()),
  estado: opcion(ESTADOS_EQUIPO, "Elige el estado."),
  ip: opcional.transform((s, ctx) => {
    if (s === null) return null;
    const ip = normalizarIPv4(s);
    if (!ip) {
      ctx.addIssue({ code: "custom", message: "No es una IPv4 válida, por ejemplo 192.168.10.25." });
      return z.NEVER;
    }
    return ip;
  }),
  mac: opcional.transform((s, ctx) => {
    if (s === null) return null;
    const mac = normalizarMAC(s);
    if (!mac) {
      ctx.addIssue({ code: "custom", message: "No es una MAC válida, por ejemplo 00:1A:2B:3C:4D:5E." });
      return z.NEVER;
    }
    return mac;
  }),
  fechaCompra: fecha,
  notas: opcional.pipe(z.string().max(2000, "Máximo 2000 caracteres.").nullable()),
});
export type EquipoDatos = z.infer<typeof esquemaEquipo>;

/** Errores de zod como { campo: primer mensaje }. */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const r: Record<string, string> = {};
  for (const i of error.issues) {
    const campo = String(i.path[0] ?? "_");
    r[campo] ??= i.message;
  }
  return r;
}

/** Los valores de un FormData como objeto plano de strings (para validar y para volver a llenar el formulario). */
export function valores(form: FormData): Record<string, string> {
  const r: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") r[k] = v;
  return r;
}

export const esquemaProblema = z.object({
  titulo: obligatorio("el título", 5, 120),
  descripcion: opcional.pipe(z.string().max(4000, "Máximo 4000 caracteres.").nullable()),
});

export const esquemaResolverProblema = z.object({
  causa: obligatorio("la causa", 5, 2000),
  solucion: obligatorio("la solución", 5, 4000),
  resolverTickets: z
    .string()
    .optional()
    .transform((s) => s === "on"),
});

/** Un folio escrito como «12» o «#12». */
export const esquemaFolio = z
  .string({ error: "Escribe el número del ticket." })
  .trim()
  .regex(/^#?\d+$/, "Escribe el número del ticket, por ejemplo 12.")
  .transform((s) => Number(s.replace("#", "")));
