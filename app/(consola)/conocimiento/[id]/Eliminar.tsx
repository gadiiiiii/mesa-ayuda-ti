"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { accionEliminarArticulo } from "@/app/acciones";

export default function Eliminar({ id }: { id: number }) {
  const [confirmando, setConfirmando] = useState(false);
  return confirmando ? (
    <form action={accionEliminarArticulo} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <span className="font-semibold">¿Eliminar el artículo?</span>
      <Button type="submit" variant="destructive">
        Sí, eliminar
      </Button>
      <Button type="button" variant="outline" onClick={() => setConfirmando(false)}>
        Cancelar
      </Button>
    </form>
  ) : (
    <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive-soft" onClick={() => setConfirmando(true)}>
      <Trash2Icon /> Eliminar
    </Button>
  );
}
