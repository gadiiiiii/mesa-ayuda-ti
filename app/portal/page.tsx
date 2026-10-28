import { ClockIcon, SearchIcon } from "lucide-react";
import { TEXTO_HORARIO } from "@/lib/horario";
import FormularioSolicitud from "./FormularioSolicitud";

export default function Portal() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold">Pide ayuda a Informática</h1>
        <p className="mt-1 max-w-[60ch] text-muted-foreground">
          Cuéntanos qué pasa. Te damos un código para que revises en qué va tu solicitud, sin crear una cuenta.
        </p>
        <FormularioSolicitud />
      </div>
      <aside className="flex flex-col gap-4 lg:mt-14">
        <section aria-labelledby="titulo-ya" className="rounded-lg border border-border bg-card p-4">
          <h2 id="titulo-ya" className="font-bold">
            ¿Ya pediste ayuda?
          </h2>
          <form action="/portal/seguimiento" className="mt-2 flex flex-col gap-2">
            <label htmlFor="codigo-buscar" className="text-sm text-muted-foreground">
              Escribe el código que te dimos.
            </label>
            <div className="flex gap-2">
              <input
                id="codigo-buscar"
                name="codigo"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="ABCD-2345"
                className="h-11 w-full min-w-0 rounded-md border border-border bg-card px-3 font-mono uppercase outline-none placeholder:text-muted-foreground/70 hover:border-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/25 sm:h-10"
              />
              <button
                type="submit"
                aria-label="Buscar solicitud"
                className="grid size-11 shrink-0 place-items-center rounded-md border border-border bg-card text-primary outline-none hover:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-primary/40 sm:size-10"
              >
                <SearchIcon className="size-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>
        <section aria-labelledby="titulo-horario" className="rounded-lg border border-border bg-card p-4 text-sm">
          <h2 id="titulo-horario" className="flex items-center gap-1.5 font-bold">
            <ClockIcon className="size-4 text-muted-foreground" aria-hidden="true" /> Horario de atención
          </h2>
          <p className="mt-1 text-muted-foreground first-letter:uppercase">{TEXTO_HORARIO}.</p>
          <p className="mt-2 text-muted-foreground">Fuera de ese horario tu solicitud queda registrada y se atiende al abrir.</p>
        </section>
      </aside>
    </div>
  );
}
