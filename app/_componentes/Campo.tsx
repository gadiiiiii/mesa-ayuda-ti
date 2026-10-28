import { AlertCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Etiqueta, control, ayuda y error de un campo. El control recibe por `children`
 * y debe usar `id`, y `aria-describedby`/`aria-invalid` con los ids que entrega `props`.
 */
export default function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  opcional,
  className,
  children,
}: {
  id: string;
  etiqueta: string;
  ayuda?: React.ReactNode;
  error?: string;
  opcional?: boolean;
  className?: string;
  children: (props: { id: string; name: string; "aria-describedby"?: string; "aria-invalid"?: true }) => React.ReactNode;
}) {
  const describe = [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {etiqueta}
        {opcional && <span className="font-normal text-muted-foreground"> (opcional)</span>}
      </label>
      {children({ id, name: id, "aria-describedby": describe, "aria-invalid": error ? true : undefined })}
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-sm text-muted-foreground">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1 text-sm font-semibold text-destructive">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export function AvisoError({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive-soft px-3 py-2 font-semibold text-destructive"
    >
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {mensaje}
    </p>
  );
}
