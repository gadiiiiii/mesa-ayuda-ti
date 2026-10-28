import Link from "next/link";
import { resumen } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { NOMBRE_CATEGORIA, NOMBRE_ESTADO_EQUIPO } from "@/lib/dominio";
import { formatearDia } from "@/lib/formato";
import { cn } from "@/lib/utils";
import TablaTickets from "@/app/_componentes/TablaTickets";
import Restablecer from "@/app/_componentes/Restablecer";

function Cifra({
  etiqueta,
  valor,
  detalle,
  href,
  alerta,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  href?: string;
  alerta?: "destructive" | "warning";
}) {
  const contenido = (
    <>
      <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
      <dd
        className={cn(
          "mt-1 text-3xl font-bold tabular-nums",
          alerta === "destructive" && "text-destructive",
          alerta === "warning" && "text-warning",
        )}
      >
        {valor}
      </dd>
      {detalle && <dd className="mt-0.5 text-sm text-muted-foreground">{detalle}</dd>}
    </>
  );
  const clase = cn(
    "block h-full rounded-lg border bg-card px-4 py-3",
    alerta === "destructive" ? "border-destructive/50" : alerta === "warning" ? "border-warning/50" : "border-border",
  );
  return (
    <div>
      {href ? (
        <Link
          href={href}
          className={cn(clase, "outline-none hover:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-primary/40")}
        >
          <dl>{contenido}</dl>
        </Link>
      ) : (
        <dl className={clase}>{contenido}</dl>
      )}
    </div>
  );
}

/** Barras horizontales de un solo tono, con el número escrito al lado (nunca solo color). */
function Barras({ filas, max }: { filas: { etiqueta: string; n: number; href?: string; apagada?: boolean }[]; max: number }) {
  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {filas.map((f) => (
        <li key={f.etiqueta} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-3 text-sm">
          {f.href ? (
            <Link href={f.href} className="truncate hover:underline">
              {f.etiqueta}
            </Link>
          ) : (
            <span className="truncate">{f.etiqueta}</span>
          )}
          <span className="h-2.5 rounded-full bg-muted" aria-hidden="true">
            <span
              className={cn("block h-full rounded-full", f.apagada ? "bg-muted-foreground/60" : "bg-primary")}
              style={{ width: f.n ? `${Math.max((f.n / max) * 100, 4)}%` : 0 }}
            />
          </span>
          <span className="text-right font-semibold tabular-nums">{f.n}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function Panel() {
  const ahora = new Date();
  const r = await resumen(await obtenerBD(), ahora);
  const maxCat = Math.max(1, ...r.porCategoria.map((c) => c.n));
  const maxTec = Math.max(1, ...r.porTecnico.map((t) => t.n));
  const maxEq = Math.max(1, ...r.equiposPorEstado.map((e) => e.n));

  return (
    <>
      <h1 className="text-3xl font-bold">Panel</h1>
      <p className="mt-1 text-muted-foreground first-letter:uppercase">{formatearDia(ahora)}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Cifra etiqueta="Pendientes" valor={String(r.pendientes)} href="/tickets" />
        <Cifra etiqueta="Vencidos" valor={String(r.vencidos)} href="/tickets" alerta={r.vencidos ? "destructive" : undefined} />
        <Cifra
          etiqueta="Por vencer"
          valor={String(r.porVencer)}
          detalle="Queda un cuarto del plazo o menos"
          href="/tickets"
          alerta={r.porVencer ? "warning" : undefined}
        />
        <Cifra etiqueta="Sin asignar" valor={String(r.sinAsignar)} href="/tickets?tecnico=sin_asignar" />
        <Cifra etiqueta="Resueltos" valor={String(r.resueltos7)} detalle="En los últimos 7 días" href="/tickets?estado=todos" />
        <Cifra
          etiqueta="Dentro del plazo"
          valor={r.cumplimiento30 === null ? "–" : `${r.cumplimiento30}%`}
          detalle={`De ${r.resueltos30} resueltos en 30 días`}
        />
      </div>

      <section aria-labelledby="titulo-atencion" className="mt-8">
        <h2 id="titulo-atencion" className="text-lg font-bold">
          Requieren atención
        </h2>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Pendientes vencidos o en el último cuarto de su plazo, los más urgentes primero.
        </p>
        {r.atencion.length ? (
          <TablaTickets filas={r.atencion} ahora={ahora} />
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
            Todos los pendientes están dentro de su plazo.
          </p>
        )}
        {r.vencidos + r.porVencer > r.atencion.length && (
          <p className="mt-2 text-sm">
            <Link href="/tickets" className="font-semibold text-primary hover:underline">
              Ver todos los pendientes ({r.pendientes})
            </Link>
          </p>
        )}
      </section>

      <div className="mt-8 grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
        <section aria-labelledby="titulo-categorias" className="rounded-lg border border-border bg-card p-5">
          <h2 id="titulo-categorias" className="text-lg font-bold">
            Pendientes por categoría
          </h2>
          {r.porCategoria.length ? (
            <Barras
              max={maxCat}
              filas={r.porCategoria.map((c) => ({
                etiqueta: NOMBRE_CATEGORIA[c.categoria],
                n: c.n,
                href: `/tickets?categoria=${c.categoria}`,
              }))}
            />
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No hay pendientes.</p>
          )}
        </section>

        <section aria-labelledby="titulo-tecnicos" className="rounded-lg border border-border bg-card p-5">
          <h2 id="titulo-tecnicos" className="text-lg font-bold">
            Carga por técnico
          </h2>
          <Barras
            max={maxTec}
            filas={r.porTecnico.map((t) => ({
              etiqueta: t.tecnico ?? "Sin asignar",
              n: t.n,
              href: `/tickets?tecnico=${encodeURIComponent(t.tecnico ?? "sin_asignar")}`,
              apagada: !t.tecnico,
            }))}
          />
        </section>

        <section aria-labelledby="titulo-equipos" className="rounded-lg border border-border bg-card p-5">
          <h2 id="titulo-equipos" className="text-lg font-bold">
            Inventario
          </h2>
          <Barras
            max={maxEq}
            filas={r.equiposPorEstado.map((e) => ({
              etiqueta: NOMBRE_ESTADO_EQUIPO[e.estado],
              n: e.n,
              href: `/inventario?estado=${e.estado}`,
            }))}
          />
        </section>
      </div>

      <Restablecer />
    </>
  );
}
