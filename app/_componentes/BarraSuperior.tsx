import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tecnicoActual } from "../sesion";
import Navegacion from "./Navegacion";
import SelectorTecnico from "./SelectorTecnico";

export default async function BarraSuperior() {
  const tecnico = await tecnicoActual();
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-[76rem] flex-wrap items-center gap-x-6 gap-y-2 px-4 pt-3 sm:px-6 lg:flex-nowrap lg:pt-0">
        <Link href="/" className="order-1 flex items-center gap-2 py-1 font-bold lg:py-4">
          <svg viewBox="0 0 24 24" className="size-6 text-primary" aria-hidden="true">
            <rect x="3" y="4" width="18" height="12" rx="2" className="fill-none stroke-current" strokeWidth="2" />
            <path d="M8 20h8M12 16v4" className="stroke-current" strokeWidth="2" strokeLinecap="round" />
            <path d="M8.5 10l2 2 4-4" className="fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Mesa de ayuda TI
        </Link>
        <Navegacion className="order-3 w-full lg:order-2 lg:w-auto" />
        <div className="order-2 ml-auto flex items-center gap-3 lg:order-3">
          <SelectorTecnico actual={tecnico} />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/tickets/nuevo">
              <PlusIcon /> Nuevo ticket
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
