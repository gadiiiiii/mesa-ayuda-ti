"use client";

import { useRef } from "react";
import { UserRoundIcon } from "lucide-react";
import { TECNICOS } from "@/lib/dominio";
import { elegirTecnico } from "../acciones";

/** Sin login: el visitante elige como qué técnico actúa. Queda registrado en el historial. */
export default function SelectorTecnico({ actual }: { actual: string }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={elegirTecnico} className="flex items-center gap-2">
      <label htmlFor="tecnico-actual" className="hidden text-sm text-muted-foreground md:inline">
        Actúas como
      </label>
      <span className="relative">
        <UserRoundIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <select
          id="tecnico-actual"
          name="tecnico"
          defaultValue={actual}
          aria-label="Actúas como"
          onChange={() => form.current?.requestSubmit()}
          className="h-10 appearance-none rounded-md border border-border bg-card pr-3 pl-8 text-sm font-semibold outline-none hover:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-primary/30"
        >
          {TECNICOS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </span>
      <noscript>
        <button type="submit" className="text-sm font-semibold text-primary">
          Cambiar
        </button>
      </noscript>
    </form>
  );
}
