import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2Icon } from "lucide-react";
import { normalizarCodigo } from "@/lib/codigo";
import { obtenerSeguimiento } from "@/lib/datos";
import { obtenerBD } from "@/lib/db";
import { ESTADO_PARA_SOLICITANTE, NOMBRE_CATEGORIA, estaPendiente } from "@/lib/dominio";
import { formatearConDia, formatearFechaHora } from "@/lib/formato";
import { EstadoTicket, EtiquetaInventario } from "@/app/_componentes/Insignias";
import { texto, type Parametros } from "@/app/_componentes/parametros";
import HistorialPortal from "./HistorialPortal";
import Responder from "./Responder";
import Encuesta from "./Encuesta";
import { obtenerEncuesta } from "@/lib/metricas";

type Props = { params: Promise<{ codigo: string }>; searchParams: Promise<Parametros> };

async function cargar(c: string) {
  const codigo = normalizarCodigo(decodeURIComponent(c));
  return codigo ? obtenerSeguimiento(await obtenerBD(), codigo) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await cargar((await params).codigo);
  return { title: s ? `Solicitud #${s.ticket.id}` : "Solicitud no encontrada" };
}

export default async function SeguimientoPage({ params, searchParams }: Props) {
  const s = await cargar((await params).codigo);
  if (!s) notFound();
  const { ticket: t, eventos } = s;
  const encuesta = t.resueltoEn ? await obtenerEncuesta(await obtenerBD(), t.id) : null;
  const nueva = texto(await searchParams, "nueva") === "1";
  const ahora = new Date();

  return (
    <div className="mx-auto max-w-[44rem]">
      {nueva && (
        <section role="status" className="mb-6 rounded-lg border border-success/40 bg-success-soft p-4">
          <p className="flex items-center gap-2 font-semibold text-success">
            <CheckCircle2Icon className="size-5" aria-hidden="true" /> Recibimos tu solicitud.
          </p>
          <p className="mt-2">
            Guarda este código para revisar en qué va: <strong className="font-mono text-lg">{t.codigo}</strong>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">También puedes guardar esta página en tus marcadores.</p>
        </section>
      )}

      <p className="text-sm text-muted-foreground">
        Solicitud #{t.id}, código <span className="font-mono">{t.codigo}</span>
      </p>
      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{t.titulo}</h1>

      <section aria-labelledby="titulo-estado" className="mt-5 rounded-lg border border-border bg-card p-5">
        <h2 id="titulo-estado" className="sr-only">
          Estado
        </h2>
        <EstadoTicket estado={t.estado} className="text-lg" />
        <p className="mt-1">{ESTADO_PARA_SOLICITANTE[t.estado]}</p>
        {s.problemaAbierto && estaPendiente(t.estado) && (
          <p className="mt-3 rounded-md border border-border bg-muted/60 px-3 py-2 text-sm">
            Hay más personas con el mismo problema. Lo estamos resolviendo en conjunto y te avisaremos aquí cuando esté listo.
          </p>
        )}
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
          <dt className="text-muted-foreground">Técnico a cargo</dt>
          <dd>{t.tecnico ?? "Todavía sin asignar"}</dd>
          {estaPendiente(t.estado) && !t.pausadoDesde && (
            <>
              <dt className="text-muted-foreground">Plazo</dt>
              <dd>Nos comprometemos a resolverla antes del {formatearConDia(t.venceEn)}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Enviada</dt>
          <dd>{formatearFechaHora(t.creadoEn, ahora)}</dd>
          <dt className="text-muted-foreground">Tema</dt>
          <dd>{NOMBRE_CATEGORIA[t.categoria]}</dd>
          {s.equipoCodigo && (
            <>
              <dt className="text-muted-foreground">Equipo</dt>
              <dd>
                <EtiquetaInventario codigo={s.equipoCodigo} />
              </dd>
            </>
          )}
        </dl>
      </section>

      <section aria-labelledby="titulo-detalle" className="mt-6">
        <h2 id="titulo-detalle" className="text-lg font-bold">
          Lo que nos contaste
        </h2>
        <p className="mt-2 max-w-[70ch] whitespace-pre-line">{t.descripcion}</p>
      </section>

      <section aria-labelledby="titulo-historial-portal" className="mt-8">
        <h2 id="titulo-historial-portal" className="text-lg font-bold">
          Qué ha pasado
        </h2>
        <HistorialPortal eventos={eventos} solicitante={t.solicitante} ahora={ahora} />
      </section>

      {t.resueltoEn &&
        (encuesta ? (
          <p role="status" className="mt-8 rounded-lg border border-border bg-card p-5">
            Calificaste la atención con <strong>{encuesta.nota} de 5</strong>. ¡Gracias!
          </p>
        ) : (
          <Encuesta codigo={t.codigo!} />
        ))}

      {t.estado !== "cerrado" && <Responder codigo={t.codigo!} resuelto={t.estado === "resuelto"} />}
    </div>
  );
}
