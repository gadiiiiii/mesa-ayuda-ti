import { formatearFecha } from "@/lib/formato";

/**
 * Barras agrupadas por semana: recibidos (tono claro) y resueltos (tono pleno) del mismo color,
 * con leyenda, el número sobre cada barra, tooltip por semana y la tabla equivalente.
 */
export default function GraficoSemanas({ semanas }: { semanas: { inicio: string; recibidos: number; resueltos: number }[] }) {
  const max = Math.max(1, ...semanas.flatMap((s) => [s.recibidos, s.resueltos]));
  const corta = (f: string) =>
    formatearFecha(f)
      .replace(/ de \d{4}$/, "")
      .replace(" de ", " ");
  return (
    <>
      <div className="mt-2 flex flex-wrap gap-4 text-sm" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-primary/40" /> Recibidos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-primary" /> Resueltos
        </span>
      </div>
      <div className="mt-4 overflow-x-auto" aria-hidden="true">
        <div className="flex h-48 min-w-max items-end gap-4 border-b border-border pb-px sm:min-w-0">
          {semanas.map((s) => (
            <div key={s.inicio} className="group relative flex h-full w-14 flex-col justify-end sm:w-auto sm:min-w-14 sm:flex-1">
              <div className="flex h-full items-end justify-center gap-[2px]">
                {[
                  { n: s.recibidos, clase: "bg-primary/40" },
                  { n: s.resueltos, clase: "bg-primary" },
                ].map((b, i) => (
                  <div key={i} className="flex h-full w-5 flex-col justify-end sm:w-full sm:max-w-12">
                    <span className="mb-0.5 text-center text-xs font-semibold tabular-nums">{b.n}</span>
                    <span className={`block rounded-t-[4px] ${b.clase}`} style={{ height: `${(b.n / max) * 80}%` }} />
                  </div>
                ))}
              </div>
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs font-semibold whitespace-nowrap text-background group-hover:block">
                Semana del {corta(s.inicio)}: {s.recibidos} recibidos, {s.resueltos} resueltos
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex min-w-max gap-4 text-xs text-muted-foreground sm:min-w-0">
          {semanas.map((s) => (
            <span key={s.inicio} className="w-14 text-center sm:w-auto sm:min-w-14 sm:flex-1">
              {corta(s.inicio)}
            </span>
          ))}
        </div>
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-primary">Ver como tabla</summary>
        <table className="mt-2 w-full max-w-md border-collapse text-left tabular-nums">
          <thead className="text-muted-foreground">
            <tr>
              <th scope="col" className="py-1 font-semibold">
                Semana del
              </th>
              <th scope="col" className="py-1 text-right font-semibold">
                Recibidos
              </th>
              <th scope="col" className="py-1 text-right font-semibold">
                Resueltos
              </th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((s) => (
              <tr key={s.inicio} className="border-t border-border">
                <th scope="row" className="py-1 text-left font-normal">
                  {corta(s.inicio)}
                </th>
                <td className="py-1 text-right">{s.recibidos}</td>
                <td className="py-1 text-right">{s.resueltos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
