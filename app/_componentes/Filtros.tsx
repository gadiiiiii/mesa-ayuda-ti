"use client";

import Form from "next/form";
import { useRef } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { SelectNativo } from "@/components/ui/input";

export interface FiltroSelect {
  nombre: string;
  etiqueta: string;
  valor: string;
  opciones: { valor: string; texto: string }[];
}

/**
 * Filtros de una lista. Viven en la URL (?estado=…&q=…), así que se pueden compartir y
 * funcionan sin JavaScript; con JavaScript, cada select aplica el filtro apenas cambia.
 */
export default function Filtros({
  accion,
  selects,
  q,
  placeholder,
  hayFiltros,
}: {
  accion: string;
  selects: FiltroSelect[];
  q: string;
  placeholder: string;
  hayFiltros: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <Form ref={form} action={accion} className="flex flex-wrap items-end gap-3" role="search">
      <div className="flex min-w-0 flex-[1_1_16rem] flex-col gap-1">
        <label htmlFor="filtro-q" className="text-sm font-semibold text-muted-foreground">
          Buscar
        </label>
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="filtro-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={placeholder}
            className="h-11 w-full rounded-md border border-border bg-card pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground/70 hover:border-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/25 sm:h-10"
          />
        </div>
      </div>
      {selects.map((s) => (
        <div key={s.nombre} className="flex min-w-36 flex-[1_1_9rem] flex-col gap-1 sm:flex-[0_1_12rem]">
          <label htmlFor={`filtro-${s.nombre}`} className="text-sm font-semibold text-muted-foreground">
            {s.etiqueta}
          </label>
          <SelectNativo id={`filtro-${s.nombre}`} name={s.nombre} defaultValue={s.valor} onChange={() => form.current?.requestSubmit()}>
            {s.opciones.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.texto}
              </option>
            ))}
          </SelectNativo>
        </div>
      ))}
      <button
        type="submit"
        className="sr-only focus:not-sr-only focus:inline-flex focus:h-10 focus:items-center focus:rounded-md focus:border focus:border-border focus:bg-card focus:px-3 focus:text-sm focus:font-semibold"
      >
        Aplicar filtros
      </button>
      {hayFiltros && (
        <Link href={accion} className="inline-flex h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:h-10">
          <XIcon className="size-4" aria-hidden="true" /> Quitar filtros
        </Link>
      )}
    </Form>
  );
}
