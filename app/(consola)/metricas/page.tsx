import type { Metadata } from "next";
import Link from "next/link";
import { DownloadIcon } from "lucide-react";
import { obtenerBD } from "@/lib/db";
import { NOMBRE_CATEGORIA } from "@/lib/dominio";
import { formatearFechaHora } from "@/lib/formato";
import { metricas, type Fila } from "@/lib/metricas";
import { cn } from "@/lib/utils";
import { texto, type Parametros } from "@/app/_componentes/parametros";
import GraficoSemanas from "./GraficoSemanas";

export const metadata: Metadata = { title: "Métricas" };

const horas = (h: number | null) => (h === null ? "–" : `${String(h).replace(".", ",")} h`);
const pct = (p: number | null) => (p === null ? "–" : `${p}%`);
const nota = (n: number | null) => (n === null ? "–" : String(n).replace(".", ","));

function Cifra({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-1 text-3xl font-bold tabular-nums">{valor}</dd>
      <dd className="mt-0.5 text-sm text-muted-foreground">{detalle}</dd>
    </div>
  );
}

function Tabla({ titulo, id, columna, filas }: { titulo: string; id: string; columna: string; filas: ({ nombre: string } & Fila)[] }) {
  return (
    <section aria-labelledby={id} className="min-w-0">
      <h2 id={id} className="text-lg font-bold">
        {titulo}
      </h2>
      <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th scope="col" className="py-2.5 pr-3 pl-4 font-semibold">
                {columna}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                Recibidos
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                Resueltos
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                En plazo
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                Resolución
              </th>
              <th scope="col" className="py-2.5 pr-4 pl-3 text-right font-semibold">
                Satisfacción
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {filas.map((f) => (
              <tr key={f.nombre} className="border-b border-border last:border-b-0">
                <th scope="row" className="py-2.5 pr-3 pl-4 text-left font-semibold">
                  {f.nombre}
                </th>
                <td className="px-3 py-2.5 text-right">{f.recibidos}</td>
                <td className="px-3 py-2.5 text-right">{f.resueltos}</td>
                <td className={cn("px-3 py-2.5 text-right", f.enPlazo !== null && f.enPlazo < 70 && "font-semibold text-warning")}>
                  {pct(f.enPlazo)}
                </td>
                <td className="px-3 py-2.5 text-right">{horas(f.horasResolucion)}</td>
                <td className="py-2.5 pr-4 pl-3 text-right">
                  {nota(f.satisfaccion)}
                  {f.encuestas > 0 && <span className="text-muted-foreground"> ({f.encuestas})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function Metricas({ searchParams }: { searchParams: Promise<Parametros> }) {
  const dias = texto(await searchParams, "dias") === "90" ? 90 : 30;
  const ahora = new Date();
  const m = await metricas(await obtenerBD(), dias, ahora);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Métricas</h1>
          <p className="mt-1 max-w-[65ch] text-muted-foreground">
            Tiempos en horas hábiles, sin contar el tiempo en espera. La satisfacción es el promedio de la encuesta (1 a 5) que responden
            los solicitantes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <nav aria-label="Período" className="flex rounded-md border border-border bg-card p-0.5 text-sm font-semibold">
            {[30, 90].map((d) => (
              <Link
                key={d}
                href={`/metricas?dias=${d}`}
                aria-current={d === dias ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-[5px] px-3",
                  d === dias ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Últimos {d} días
              </Link>
            ))}
          </nav>
          <a
            href={`/api/exportar?dias=${dias}`}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <DownloadIcon className="size-4" aria-hidden="true" /> Exportar a Excel (CSV)
          </a>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Cifra etiqueta="Recibidos" valor={String(m.total.recibidos)} detalle={`${m.total.resueltos} resueltos`} />
        <Cifra etiqueta="Dentro del plazo" valor={pct(m.total.enPlazo)} detalle="de los resueltos" />
        <Cifra
          etiqueta="Primera respuesta"
          valor={horas(m.total.horasPrimeraRespuesta)}
          detalle="promedio hasta que un técnico lo atiende"
        />
        <Cifra etiqueta="Resolución" valor={horas(m.total.horasResolucion)} detalle="promedio hasta resolver" />
        <Cifra
          etiqueta="Satisfacción"
          valor={nota(m.total.satisfaccion)}
          detalle={m.total.encuestas ? `${pct(m.total.satisfechos)} con 4 o 5, de ${m.total.encuestas} encuestas` : "sin encuestas"}
        />
      </dl>

      <section aria-labelledby="titulo-semanas" className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 id="titulo-semanas" className="text-lg font-bold">
          Tickets por semana
        </h2>
        <GraficoSemanas semanas={m.porSemana} />
      </section>

      <div className="mt-8 flex flex-col gap-8">
        <Tabla
          titulo="Por categoría"
          id="titulo-por-categoria"
          columna="Categoría"
          filas={m.porCategoria.map((c) => ({ nombre: NOMBRE_CATEGORIA[c.categoria], ...c }))}
        />
        <Tabla
          titulo="Por técnico"
          id="titulo-por-tecnico"
          columna="Técnico"
          filas={m.porTecnico.map((t) => ({ nombre: t.tecnico, ...t }))}
        />
      </div>

      {m.comentarios.length > 0 && (
        <section aria-labelledby="titulo-comentarios" className="mt-8">
          <h2 id="titulo-comentarios" className="text-lg font-bold">
            Lo último que dijeron en la encuesta
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {m.comentarios.map((c) => (
              <li key={c.ticketId} className="rounded-lg border border-border bg-card px-4 py-3">
                <p>«{c.comentario}»</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nota {c.nota} de 5,{" "}
                  <Link href={`/tickets/${c.ticketId}`} className="text-primary underline underline-offset-2">
                    ticket #{c.ticketId}
                  </Link>
                  , {formatearFechaHora(c.creadoEn, ahora)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
