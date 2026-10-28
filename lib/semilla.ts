import { nuevoCodigo } from "./codigo";
import type { BD } from "./db";
import { aLocal, desdeLocal, habilesEntre, sumarDia, sumarHabiles, ventana } from "./horario";
import { equipos, eventos, tickets } from "./db/esquema";
import {
  HORAS_PLAZO,
  PREFIJO_TIPO,
  TECNICOS,
  UNIDADES,
  calcularVencimiento,
  esEventoPublico,
  estaPendiente,
  type Categoria,
  type Estado,
  type EstadoEquipo,
  type Prioridad,
  type TipoEquipo,
} from "./dominio";

/**
 * Datos de ejemplo: unos 45 equipos y 75 tickets de los últimos 30 días, con su historial.
 * Salen de una semilla fija, así que siempre son los mismos; las fechas se calculan
 * desde `ahora` para que la demo siempre tenga tickets recientes, vencidos y por vencer.
 * Todos los nombres son inventados.
 */

function crearAzar(semilla: number) {
  let a = semilla >>> 0;
  const siguiente = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    siguiente,
    entero: (min: number, max: number) => min + Math.floor(siguiente() * (max - min + 1)),
    elegir: <T>(lista: readonly T[]): T => lista[Math.floor(siguiente() * lista.length)],
    ponderado: <T>(opciones: readonly (readonly [T, number])[]): T => {
      const total = opciones.reduce((s, [, p]) => s + p, 0);
      let r = siguiente() * total;
      for (const [v, p] of opciones) if ((r -= p) < 0) return v;
      return opciones[opciones.length - 1][0];
    },
  };
}

const NOMBRES = [
  "María",
  "José",
  "Carolina",
  "Luis",
  "Francisca",
  "Jorge",
  "Paula",
  "Andrés",
  "Daniela",
  "Rodrigo",
  "Javiera",
  "Cristián",
  "Constanza",
  "Felipe",
  "Macarena",
  "Sebastián",
  "Patricia",
  "Héctor",
  "Fernanda",
  "Nicolás",
];
const APELLIDOS = [
  "González",
  "Muñoz",
  "Rojas",
  "Díaz",
  "Pérez",
  "Soto",
  "Contreras",
  "Silva",
  "Martínez",
  "Sepúlveda",
  "Morales",
  "Rodríguez",
  "López",
  "Fuentes",
  "Hernández",
  "Torres",
  "Araya",
  "Flores",
  "Espinoza",
  "Valenzuela",
];

const MODELOS: Record<TipoEquipo, readonly (readonly [string, string])[]> = {
  notebook: [
    ["Lenovo", "ThinkPad E14 Gen 5"],
    ["HP", "ProBook 440 G10"],
    ["Dell", "Latitude 3440"],
  ],
  escritorio: [
    ["HP", "ProDesk 400 G7"],
    ["Lenovo", "ThinkCentre M70s"],
    ["Dell", "OptiPlex 3000"],
  ],
  monitor: [
    ["Samsung", "S24R350"],
    ["LG", "24MK400H"],
    ["Dell", "P2422H"],
  ],
  impresora: [
    ["HP", "LaserJet Pro M404dn"],
    ["Brother", "HL-L5100DN"],
    ["Kyocera", "ECOSYS M2040dn"],
  ],
  switch: [
    ["Cisco", "Catalyst 2960-X 24"],
    ["TP-Link", "TL-SG3428"],
  ],
  router: [["MikroTik", "RB4011iGS+"]],
  access_point: [
    ["Ubiquiti", "UniFi U6 Lite"],
    ["TP-Link", "EAP225"],
  ],
  telefono: [
    ["Grandstream", "GXP1625"],
    ["Yealink", "SIP-T31P"],
  ],
  otro: [["Epson", "PowerLite X49 (proyector)"]],
};

interface Plantilla {
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  /** Tipo de equipo al que se asocia, si corresponde. */
  equipo?: TipoEquipo;
  solucion: string;
}

const PLANTILLAS: Plantilla[] = [
  {
    categoria: "hardware",
    equipo: "escritorio",
    titulo: "El computador no enciende",
    descripcion: "Al presionar el botón de encendido no pasa nada, ni luces ni ventilador. Ayer funcionaba normal.",
    solucion: "La fuente de poder estaba dañada. Se reemplazó por una de bodega y el equipo enciende correctamente.",
  },
  {
    categoria: "hardware",
    equipo: "notebook",
    titulo: "Notebook muy lento al iniciar",
    descripcion: "Demora más de 10 minutos en dejar trabajar después de encender. Se queda pegado en la pantalla de inicio.",
    solucion: "Disco al 98 %. Se liberó espacio, se desactivaron programas de inicio y se programó cambio a SSD.",
  },
  {
    categoria: "hardware",
    equipo: "monitor",
    titulo: "El monitor parpadea",
    descripcion: "La pantalla se pone negra por un segundo cada cierto rato. Pasa más en la tarde.",
    solucion: "El cable HDMI estaba suelto y dañado. Se cambió por uno nuevo.",
  },
  {
    categoria: "hardware",
    equipo: "escritorio",
    titulo: "Teclado con teclas que no responden",
    descripcion: "La tecla Enter y la barra espaciadora fallan; hay que apretarlas varias veces.",
    solucion: "Se reemplazó el teclado por uno nuevo de bodega.",
  },
  {
    categoria: "software",
    titulo: "Error al abrir el sistema de contabilidad",
    descripcion: "Al entrar al sistema aparece «Error de conexión con el servidor» y se cierra. A mis compañeros sí les funciona.",
    solucion: "El acceso directo apuntaba al servidor antiguo. Se actualizó la configuración del cliente.",
  },
  {
    categoria: "software",
    titulo: "Instalar programa para firmar documentos",
    descripcion: "Necesito el software de firma electrónica avanzada para firmar decretos desde mi equipo.",
    solucion: "Se instaló el software de firma y se probó con un documento de prueba.",
  },
  {
    categoria: "software",
    titulo: "El correo no sincroniza en Outlook",
    descripcion: "No me llegan correos desde la mañana, pero en el celular sí aparecen.",
    solucion: "El perfil de Outlook estaba dañado. Se creó un perfil nuevo y se resincronizó el buzón.",
  },
  {
    categoria: "software",
    titulo: "Actualizar planilla de cálculo que no abre archivos",
    descripcion: "Los archivos .xlsx que mandan de otras unidades aparecen como dañados.",
    solucion: "Se actualizó la suite ofimática a la versión vigente; los archivos abren bien.",
  },
  {
    categoria: "red",
    titulo: "Sin internet en la oficina",
    descripcion: "Los tres computadores de la oficina están sin internet. El teléfono sí funciona.",
    equipo: "switch",
    solucion: "Un puerto del switch quedó deshabilitado por un bucle de red. Se quitó el cable que lo causaba y se reactivó el puerto.",
  },
  {
    categoria: "red",
    equipo: "access_point",
    titulo: "El wifi de la sala de reuniones se corta",
    descripcion: "Durante las reuniones el wifi se desconecta cada 10 a 15 minutos.",
    solucion: "El access point estaba en un canal saturado. Se cambió a canal 36 en 5 GHz y se actualizó el firmware.",
  },
  {
    categoria: "red",
    titulo: "No carga la carpeta compartida",
    descripcion: "Al abrir la unidad de red aparece «No se encuentra la ruta de acceso».",
    solucion: "Se volvió a mapear la unidad de red con la ruta del servidor nuevo.",
  },
  {
    categoria: "impresoras",
    equipo: "impresora",
    titulo: "La impresora no imprime",
    descripcion: "Los documentos quedan en la cola y no salen. La impresora muestra la luz verde normal.",
    solucion: "La impresora había cambiado de IP. Se le dejó IP fija y se actualizó el puerto en los equipos.",
  },
  {
    categoria: "impresoras",
    equipo: "impresora",
    titulo: "Atasco de papel constante",
    descripcion: "Cada 5 o 6 hojas se atasca el papel en la bandeja 2.",
    solucion: "El rodillo de arrastre estaba gastado. Se limpió y se pidió el repuesto; mientras tanto se usa la bandeja 1.",
  },
  {
    categoria: "impresoras",
    equipo: "impresora",
    titulo: "Cambiar tóner",
    descripcion: "La impresora indica tóner bajo y las copias salen claras.",
    solucion: "Se instaló tóner nuevo.",
  },
  {
    categoria: "impresoras",
    titulo: "Instalar impresora en un PC nuevo",
    descripcion: "Me cambiaron el computador y no tengo la impresora de la oficina.",
    solucion: "Se instaló el controlador y se agregó la impresora de red.",
  },
  {
    categoria: "cuentas",
    titulo: "Crear cuenta de correo para funcionario nuevo",
    descripcion: "Ingresa un funcionario el lunes y necesita correo institucional y acceso al computador.",
    solucion: "Se creó la cuenta de correo y de dominio; se enviaron las credenciales a la jefatura.",
  },
  {
    categoria: "cuentas",
    titulo: "Restablecer contraseña",
    descripcion: "Olvidé mi contraseña después de las vacaciones y no puedo entrar al computador.",
    solucion: "Se restableció la contraseña y se pidió cambiarla en el primer ingreso.",
  },
  {
    categoria: "cuentas",
    titulo: "Dar acceso a carpeta compartida",
    descripcion: "Necesito acceso de lectura a la carpeta compartida de la unidad para revisar antecedentes.",
    solucion: "Con la autorización de la jefatura, se agregó el usuario al grupo con permiso de lectura.",
  },
  {
    categoria: "telefonia",
    equipo: "telefono",
    titulo: "El anexo no tiene tono",
    descripcion: "Al levantar el teléfono no hay tono y la pantalla dice «Sin registro».",
    solucion: "El teléfono perdió el registro en la central. Se reconfiguró la cuenta SIP.",
  },
  {
    categoria: "telefonia",
    equipo: "telefono",
    titulo: "Configurar desvío de llamadas",
    descripcion: "Necesito que las llamadas a mi anexo se desvíen a secretaría cuando no contesto.",
    solucion: "Se configuró el desvío por no contestar a los 20 segundos.",
  },
  {
    categoria: "otro",
    titulo: "Apoyo para videoconferencia",
    descripcion: "Mañana a las 10:00 hay una videoconferencia en el salón y necesitamos cámara, micrófono y proyector funcionando.",
    solucion: "Se instaló y probó el equipo de videoconferencia; un técnico acompañó el inicio.",
  },
];

const NOTAS_ESPERA = [
  "Se pidió el repuesto al proveedor; llega en 2 o 3 días.",
  "Esperando que el solicitante confirme un horario para revisar el equipo.",
  "Esperando la autorización de la jefatura.",
];

/** Comentarios de técnicos: notas internas y respuestas que ve el solicitante. */
const COMENTARIOS: readonly { texto: string; publico: boolean }[] = [
  { texto: "Revisé en terreno. Hay que volver con un repuesto.", publico: false },
  { texto: "El solicitante dice por teléfono que el problema sigue en la tarde.", publico: false },
  { texto: "Le pedí reiniciar el equipo y avisarnos si se repite.", publico: true },
  { texto: "Paso por su oficina en la tarde para revisarlo.", publico: true },
];

/** Lo que escribe el solicitante desde el portal. */
const MENSAJES_SOLICITANTE = [
  "Sigue igual. Ahora el mensaje aparece apenas enciendo el equipo.",
  "Estaré en la oficina toda la mañana, pueden pasar cuando quieran.",
  "Gracias, quedo atento.",
];

const MOTIVOS_CIERRE = ["Duplicado de otro ticket.", "El solicitante indica que ya no lo necesita."];

const HORA = 3_600_000;

/** Un momento en horario de oficina de hace `diasAtras` días (o del día hábil anterior), nunca después de `ahora`. */
function momentoHabil(az: ReturnType<typeof crearAzar>, ahora: Date, diasAtras: number): Date {
  const hoy = aLocal(ahora);
  let fecha = sumarDia(hoy.fecha, -diasAtras);
  for (let i = 0; i < 30; i++) {
    const v = ventana(fecha);
    if (v) {
      const fin = fecha === hoy.fecha ? Math.min(v[1] - 30 * 60_000, hoy.ms) : v[1] - 30 * 60_000;
      if (fin > v[0]) return desdeLocal(fecha, v[0] + Math.floor(az.siguiente() * (fin - v[0])));
    }
    fecha = sumarDia(fecha, -1);
  }
  return ahora;
}

export async function sembrar(bd: BD, ahora: Date): Promise<{ equipos: number; tickets: number }> {
  const az = crearAzar(20261028);
  const persona = () => `${az.elegir(NOMBRES)} ${az.elegir(APELLIDOS)}`;

  // ── Equipos ──
  const contadores: Partial<Record<TipoEquipo, number>> = {};
  const lista: (typeof equipos.$inferInsert)[] = [];
  let ipOficina = 20;
  let ipTelefono = 10;
  const agregar = (tipo: TipoEquipo, unidad: string, extra: Partial<typeof equipos.$inferInsert> = {}) => {
    const n = (contadores[tipo] = (contadores[tipo] ?? 0) + 1);
    const [marca, modelo] = az.elegir(MODELOS[tipo]);
    const anio = az.entero(2018, 2025);
    lista.push({
      codigo: `${PREFIJO_TIPO[tipo]}-${String(n).padStart(4, "0")}`,
      tipo,
      marca,
      modelo,
      serie: `${marca.slice(0, 2).toUpperCase()}${az.entero(10_000_000, 99_999_999)}`,
      unidad,
      responsable: null,
      estado: "en_uso",
      fechaCompra: `${anio}-${String(az.entero(1, 12)).padStart(2, "0")}-${String(az.entero(1, 28)).padStart(2, "0")}`,
      ...extra,
    });
  };

  for (const unidad of UNIDADES) {
    const puestos = unidad === "Informática" ? 3 : az.entero(1, 3);
    for (let i = 0; i < puestos; i++) {
      const responsable = persona();
      agregar(az.siguiente() < 0.35 ? "notebook" : "escritorio", unidad, { responsable });
      if (az.siguiente() < 0.6) agregar("monitor", unidad, { responsable });
    }
    agregar("impresora", unidad, { ip: `192.168.10.${ipOficina++}` });
    if (az.siguiente() < 0.5) agregar("telefono", unidad, { ip: `192.168.20.${ipTelefono++}` });
  }
  agregar("router", "Informática", { ip: "192.168.1.1", notas: "Router de borde. Enlace de fibra del proveedor en el puerto ether1." });
  agregar("switch", "Informática", { ip: "192.168.1.2", notas: "Switch central del rack del primer piso." });
  agregar("switch", "Dirección de Obras", { ip: "192.168.1.3" });
  agregar("switch", "Tránsito", { ip: "192.168.1.4" });
  for (let i = 0; i < 3; i++) agregar("access_point", az.elegir(UNIDADES), { ip: `192.168.1.${20 + i}` });
  agregar("otro", "Alcaldía", { responsable: "Secretaría de Alcaldía" });
  // Algunos equipos fuera de uso, para que el inventario tenga de todo.
  const estadosEspeciales: EstadoEquipo[] = ["en_bodega", "en_bodega", "en_reparacion", "de_baja", "de_baja"];
  for (const estado of estadosEspeciales) {
    const e = az.elegir(
      lista.filter((x) => x.estado === "en_uso" && (x.tipo === "escritorio" || x.tipo === "notebook" || x.tipo === "monitor")),
    );
    e.estado = estado;
    if (estado !== "en_reparacion") e.responsable = null;
    if (estado === "de_baja") e.notas = "Dado de baja por obsolescencia.";
  }
  for (const e of lista) {
    if (e.ip && az.siguiente() < 0.7) {
      e.mac = Array.from({ length: 6 }, (_, i) =>
        (i === 0 ? az.entero(0, 63) * 4 : az.entero(0, 255)).toString(16).padStart(2, "0").toUpperCase(),
      ).join(":");
    }
    e.creadoEn = new Date(ahora.getTime() - 60 * 24 * HORA);
    e.actualizadoEn = e.creadoEn;
  }
  const insertados = await bd
    .insert(equipos)
    .values(lista)
    .returning({ id: equipos.id, tipo: equipos.tipo, unidad: equipos.unidad, responsable: equipos.responsable, estado: equipos.estado });

  // ── Tickets ──
  type Fila = { ticket: typeof tickets.$inferInsert; eventos: Omit<typeof eventos.$inferInsert, "ticketId">[] };
  const filas: Fila[] = [];
  const TOTAL = 75;
  for (let k = 0; k < TOTAL; k++) {
    // Más tickets recientes que antiguos, y siempre en horario de oficina.
    const creadoEn = momentoHabil(az, ahora, Math.floor(Math.pow(az.siguiente(), 1.6) * 30));
    const plantilla = az.elegir(PLANTILLAS);
    const prioridad = az.ponderado<Prioridad>([
      ["baja", 25],
      ["media", 45],
      ["alta", 22],
      ["urgente", 8],
    ]);
    const candidatos = plantilla.equipo ? insertados.filter((e) => e.tipo === plantilla.equipo && e.estado !== "de_baja") : [];
    const equipo = candidatos.length ? az.elegir(candidatos) : null;
    const unidad = equipo?.unidad ?? az.elegir(UNIDADES);
    const solicitante = equipo?.responsable ?? persona();
    const tecnico = az.elegir(TECNICOS);
    // Casi la mitad llega por el portal; el resto lo registra un técnico que recibió el llamado o el correo.
    const origen = az.siguiente() < 0.45 ? ("portal" as const) : ("mesa" as const);
    const ev: Fila["eventos"] = [{ tipo: "creado", autor: origen === "portal" ? solicitante : az.elegir(TECNICOS), creadoEn }];
    // Todo se mide en horas hábiles desde la creación.
    const en = (horas: number) => sumarHabiles(creadoEn, horas * HORA);

    const plazoHoras = HORAS_PLAZO[prioridad];
    const edad = habilesEntre(creadoEn, ahora) / HORA;
    const probPendiente = edad < 9 ? 0.8 : edad < 27 ? 0.4 : edad < 63 ? 0.12 : 0.02;
    let estado: Estado;
    let resueltoEn: Date | null = null;
    let asignado: string | null = null;
    let pausadoDesde: Date | null = null;

    // Tomado por un técnico al rato de llegar.
    const tomado = Math.min(edad * 0.5, az.siguiente() * Math.min(plazoHoras, 6) * 0.3 + 0.1);
    const tomar = () => {
      asignado = tecnico;
      ev.push({ tipo: "asignacion", autor: tecnico, hacia: tecnico, creadoEn: en(tomado) });
      ev.push({ tipo: "estado", autor: tecnico, desde: "abierto", hacia: "en_curso", creadoEn: en(tomado) });
    };

    let duracion = plazoHoras * (az.siguiente() < 0.8 ? 0.2 + az.siguiente() * 0.75 : 1.1 + az.siguiente() * 2);
    if (duracion >= edad) duracion = Number.POSITIVE_INFINITY;

    if (az.siguiente() < probPendiente || duracion === Number.POSITIVE_INFINITY) {
      estado = az.ponderado<Estado>([
        ["abierto", 3],
        ["en_curso", 5],
        ["en_espera", 2],
      ]);
      if (estado !== "abierto") tomar();
      if (estado === "en_espera") {
        pausadoDesde = en(Math.min(edad * 0.8, tomado + 1));
        ev.push({
          tipo: "estado",
          autor: tecnico,
          desde: "en_curso",
          hacia: "en_espera",
          texto: az.elegir(NOTAS_ESPERA),
          creadoEn: pausadoDesde,
        });
      } else if (estado === "en_curso" && az.siguiente() < 0.4) {
        ev.push({ tipo: "comentario", autor: tecnico, ...az.elegir(COMENTARIOS), creadoEn: en(Math.min(edad * 0.9, tomado + 0.5)) });
      }
    } else if (az.siguiente() < 0.04) {
      estado = "cerrado";
      ev.push({
        tipo: "estado",
        autor: tecnico,
        desde: "abierto",
        hacia: "cerrado",
        texto: az.elegir(MOTIVOS_CIERRE),
        creadoEn: en(Math.min(duracion, 2)),
      });
    } else {
      tomar();
      if (az.siguiente() < 0.3)
        ev.push({ tipo: "comentario", autor: tecnico, ...az.elegir(COMENTARIOS), creadoEn: en(tomado + (duracion - tomado) / 2) });
      resueltoEn = en(duracion);
      estado = "resuelto";
      ev.push({ tipo: "estado", autor: tecnico, desde: "en_curso", hacia: "resuelto", texto: plantilla.solucion, creadoEn: resueltoEn });
      if (edad - duracion > 18 && az.siguiente() < 0.7) {
        estado = "cerrado";
        ev.push({ tipo: "estado", autor: tecnico, desde: "resuelto", hacia: "cerrado", creadoEn: en(duracion + 9) });
      }
    }

    // Algunos solicitantes del portal agregan información mientras esperan.
    if (origen === "portal" && estaPendiente(estado) && edad > 1 && az.siguiente() < 0.5) {
      ev.push({ tipo: "comentario", autor: solicitante, texto: az.elegir(MENSAJES_SOLICITANTE), publico: true, creadoEn: en(edad * 0.6) });
    }
    for (const e of ev) e.publico ||= esEventoPublico(e.tipo!);

    const ultimo = ev.reduce((m, e) => (e.creadoEn! > m ? e.creadoEn! : m), creadoEn);
    filas.push({
      ticket: {
        titulo: plantilla.titulo,
        descripcion: plantilla.descripcion,
        solicitante,
        unidad,
        categoria: plantilla.categoria,
        prioridad,
        estado,
        tecnico: asignado,
        equipoId: equipo?.id ?? null,
        creadoEn,
        actualizadoEn: ultimo,
        venceEn: calcularVencimiento(creadoEn, prioridad),
        resueltoEn,
        pausadoDesde,
        origen,
        codigo: nuevoCodigo(() => az.siguiente()),
      },
      eventos: ev,
    });
  }

  // Números de ticket en orden de llegada.
  filas.sort((a, b) => a.ticket.creadoEn!.getTime() - b.ticket.creadoEn!.getTime());
  const ids = await bd
    .insert(tickets)
    .values(filas.map((f) => f.ticket))
    .returning({ id: tickets.id });
  await bd.insert(eventos).values(filas.flatMap((f, i) => f.eventos.map((e) => ({ ...e, ticketId: ids[i].id }))));
  return { equipos: insertados.length, tickets: ids.length };
}
