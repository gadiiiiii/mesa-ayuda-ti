import {
  AlertTriangleIcon,
  ArchiveIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleDotIcon,
  ClockIcon,
  PauseCircleIcon,
  PauseIcon,
} from "lucide-react";
import {
  NOMBRE_ESTADO,
  NOMBRE_ESTADO_EQUIPO,
  NOMBRE_PRIORIDAD,
  PRIORIDADES,
  plazo as calcularPlazo,
  textoPlazo,
  type Estado,
  type EstadoEquipo,
  type Prioridad,
} from "@/lib/dominio";
import { cn } from "@/lib/utils";

const ICONO_ESTADO = {
  abierto: CircleDashedIcon,
  en_curso: CircleDotIcon,
  en_espera: PauseCircleIcon,
  resuelto: CheckCircle2Icon,
  cerrado: ArchiveIcon,
} as const;

const COLOR_ESTADO: Record<Estado, string> = {
  abierto: "text-foreground",
  en_curso: "text-primary",
  en_espera: "text-muted-foreground",
  resuelto: "text-success",
  cerrado: "text-muted-foreground",
};

export function EstadoTicket({ estado, className }: { estado: Estado; className?: string }) {
  const Icono = ICONO_ESTADO[estado];
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-medium whitespace-nowrap", COLOR_ESTADO[estado], className)}>
      <Icono className="size-4" aria-hidden="true" />
      {NOMBRE_ESTADO[estado]}
    </span>
  );
}

/** Barras de señal: 1 a 4 según la prioridad. */
export function PrioridadTicket({ prioridad, className }: { prioridad: Prioridad; className?: string }) {
  const nivel = PRIORIDADES.indexOf(prioridad) + 1;
  const color = prioridad === "urgente" ? "text-destructive" : prioridad === "alta" ? "text-warning" : "text-foreground";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", color, prioridad === "urgente" && "font-semibold", className)}
    >
      <svg viewBox="0 0 14 12" className="h-3 w-3.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={i * 3.6}
            y={9 - i * 3}
            width="2.4"
            height={3 + i * 3}
            rx="0.6"
            className={i < nivel ? "fill-current" : "fill-muted-foreground/30"}
          />
        ))}
      </svg>
      {NOMBRE_PRIORIDAD[prioridad]}
    </span>
  );
}

type DatosPlazo = Parameters<typeof calcularPlazo>[0];

/**
 * La barra de plazo: cuánto del plazo hábil de la prioridad ya se usó.
 * Gris a tiempo, ámbar en el último cuarto, roja y llena si se venció, y apagada con ícono
 * de pausa mientras el ticket está en espera. Siempre con el texto.
 */
export function Plazo({ ticket, ahora, compacto = false }: { ticket: DatosPlazo; ahora: Date; compacto?: boolean }) {
  const p = calcularPlazo(ticket, ahora);
  const texto = textoPlazo(p);
  if (p.estado === "cumplido" || p.estado === "incumplido" || p.estado === "sin_plazo") {
    return <span className={cn("text-sm", p.estado === "incumplido" ? "text-warning" : "text-muted-foreground")}>{texto}</span>;
  }
  const usado = p.usado;
  const tono =
    p.estado === "pausado"
      ? { barra: p.diferencia > 0 ? "bg-muted-foreground/40" : "bg-destructive/50", texto: "text-muted-foreground", Icono: PauseIcon }
      : p.estado === "vencido"
        ? { barra: "bg-destructive", texto: "text-destructive font-semibold", Icono: AlertTriangleIcon }
        : p.estado === "por_vencer"
          ? { barra: "bg-warning", texto: "text-warning font-semibold", Icono: ClockIcon }
          : { barra: "bg-muted-foreground/70", texto: "text-muted-foreground", Icono: ClockIcon };
  return (
    <span className={cn("flex flex-col gap-1", compacto ? "w-44" : "w-full max-w-64")}>
      <span className={cn("inline-flex items-center gap-1 text-sm", tono.texto)}>
        <tono.Icono className="size-3.5 shrink-0" aria-hidden="true" />
        {texto}
      </span>
      <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span className={cn("block h-full rounded-full", tono.barra)} style={{ width: `${Math.max(usado * 100, 3)}%` }} />
      </span>
    </span>
  );
}

/** El código de inventario como la etiqueta pegada en el equipo. */
export function EtiquetaInventario({ codigo, className }: { codigo: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-border border-l-[3px] border-l-foreground/70 bg-card px-1.5 py-px font-mono text-sm font-medium whitespace-nowrap",
        className,
      )}
    >
      {codigo}
    </span>
  );
}

export function Folio({ id, className }: { id: number; className?: string }) {
  return <span className={cn("font-mono font-normal text-muted-foreground", className)}>#{id}</span>;
}

const COLOR_EQUIPO: Record<EstadoEquipo, string> = {
  en_uso: "text-foreground",
  en_bodega: "text-muted-foreground",
  en_reparacion: "text-warning",
  de_baja: "text-muted-foreground",
};

export function EstadoEquipoTexto({ estado }: { estado: EstadoEquipo }) {
  return <span className={cn("whitespace-nowrap", COLOR_EQUIPO[estado])}>{NOMBRE_ESTADO_EQUIPO[estado]}</span>;
}
