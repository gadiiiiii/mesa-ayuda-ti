import { count } from "drizzle-orm";
import type { BD } from "./db";
import { articulos, respuestas } from "./db/esquema";
import type { Categoria } from "./dominio";

/** Artículos y respuestas de ejemplo. Se cargan si la base no tiene ninguno. */

const ARTICULOS: { titulo: string; categoria: Categoria; publico: boolean; utiles: number; contenido: string }[] = [
  {
    titulo: "La impresora no imprime: reiniciar la cola de impresión",
    categoria: "impresoras",
    publico: true,
    utiles: 14,
    contenido: `Si los documentos quedan «en cola» y no salen, casi siempre se arregla limpiando la cola de impresión.

1. Abre Configuración, luego Bluetooth y dispositivos, luego Impresoras y escáneres.
2. Elige la impresora y abre la cola de impresión.
3. En el menú Impresora, elige Cancelar todos los documentos.
4. Apaga la impresora, espera 30 segundos y vuelve a encenderla.
5. Imprime una página de prueba.

Si sigue sin imprimir, pide ayuda indicando el código de la impresora (está en la etiqueta, por ejemplo IMP-0003).`,
  },
  {
    titulo: "Outlook no recibe correos",
    categoria: "software",
    publico: true,
    utiles: 9,
    contenido: `Si en el celular te llegan los correos pero en Outlook no:

1. Revisa la barra inferior de Outlook: si dice «Trabajando sin conexión», ve a la pestaña Enviar y recibir y desactiva Trabajar sin conexión.
2. Cierra Outlook por completo y vuelve a abrirlo.
3. Si el buzón está lleno, archiva o elimina correos antiguos con adjuntos pesados.

Si después de esto no llegan correos, pide ayuda: puede ser necesario recrear tu perfil de Outlook.`,
  },
  {
    titulo: "Cambiar tu contraseña del computador",
    categoria: "cuentas",
    publico: true,
    utiles: 11,
    contenido: `La contraseña vence cada 90 días. Para cambiarla antes:

1. Presiona Ctrl + Alt + Supr.
2. Elige Cambiar una contraseña.
3. Escribe la actual y dos veces la nueva.

La nueva debe tener al menos 10 caracteres y no puede ser igual a las últimas 5. Si olvidaste la tuya, pide ayuda: un técnico la restablece y te pide cambiarla al entrar.`,
  },
  {
    titulo: "Conectarse al wifi institucional",
    categoria: "red",
    publico: true,
    utiles: 6,
    contenido: `La red para funcionarios es «Municipal-Funcionarios». Se entra con el mismo usuario y contraseña del computador.

- La red «Municipal-Visitas» es solo para público: no da acceso a las carpetas compartidas ni a los sistemas internos.
- Si el celular pregunta por un certificado, acéptalo.
- Si cambiaste tu contraseña, olvida la red en el dispositivo y vuelve a conectarte.`,
  },
  {
    titulo: "No encuentro la carpeta compartida de mi unidad",
    categoria: "red",
    publico: true,
    utiles: 4,
    contenido: `Las carpetas compartidas aparecen en Este equipo como una unidad de red (por ejemplo, la letra S:).

1. Abre el Explorador de archivos y entra a Este equipo.
2. Si no aparece, en la barra de direcciones escribe la ruta que te indicó tu jefatura y presiona Enter.
3. Si dice que no tienes permiso, pide ayuda: el acceso lo autoriza la jefatura de la unidad.`,
  },
  {
    titulo: "Teléfono IP sin tono: reconfigurar la cuenta SIP",
    categoria: "telefonia",
    publico: false,
    utiles: 0,
    contenido: `Cuando un anexo muestra «Sin registro»:

1. Entra a la interfaz web del teléfono con su IP (está en la ficha del inventario).
2. En Cuentas, revisa servidor SIP, usuario y contraseña del anexo.
3. Guarda y reinicia el teléfono.
4. Si varios anexos fallan a la vez, revisa primero la central y su UPS: ver el problema «Los teléfonos IP pierden el registro en la central».`,
  },
  {
    titulo: "Preparar el equipo de un funcionario nuevo",
    categoria: "cuentas",
    publico: false,
    utiles: 0,
    contenido: `Lista para el primer día:

- Crear la cuenta del dominio y del correo con la autorización de la jefatura.
- Agregarlo a los grupos de su unidad (carpetas compartidas e impresoras).
- Instalar la firma electrónica si la va a usar.
- Registrar el equipo en el inventario con su nombre como responsable.
- Enviarle por escrito su usuario y pedirle cambiar la contraseña al entrar.`,
  },
];

const RESPUESTAS = [
  {
    titulo: "Pedir más información",
    texto:
      "Hola {solicitante}: para revisar tu solicitud {folio} necesito un poco más de información. ¿Me puedes indicar desde cuándo pasa y si aparece algún mensaje en pantalla?",
  },
  {
    titulo: "Visita en terreno",
    texto: "Hola {solicitante}: paso por tu oficina hoy para revisarlo en persona. Saludos, {tecnico}.",
  },
  {
    titulo: "Reiniciar y probar",
    texto: "Hola {solicitante}: por favor reinicia el equipo y vuelve a intentarlo. Si el problema sigue, respóndenos aquí y lo revisamos.",
  },
  {
    titulo: "Confirmar solución",
    texto: "Hola {solicitante}: dejamos resuelto tu caso {folio}. Si el problema vuelve a aparecer, escríbenos en esta misma solicitud.",
  },
];

export async function sembrarConocimiento(bd: BD, ahora: Date): Promise<{ articulos: number; respuestas: number }> {
  const [{ n: hayArticulos }] = await bd.select({ n: count() }).from(articulos);
  const [{ n: hayRespuestas }] = await bd.select({ n: count() }).from(respuestas);
  let a = 0;
  let r = 0;
  if (Number(hayArticulos) === 0) {
    const autores = ["Camila Rojas", "Diego Fuentes", "Valentina Soto"];
    await bd.insert(articulos).values(
      ARTICULOS.map((x, i) => ({
        ...x,
        autor: autores[i % autores.length],
        noUtiles: Math.floor(x.utiles / 5),
        creadoEn: new Date(ahora.getTime() - (40 - i) * 86_400_000),
        actualizadoEn: new Date(ahora.getTime() - (20 - i) * 86_400_000),
      })),
    );
    a = ARTICULOS.length;
  }
  if (Number(hayRespuestas) === 0) {
    await bd.insert(respuestas).values(RESPUESTAS);
    r = RESPUESTAS.length;
  }
  return { articulos: a, respuestas: r };
}
