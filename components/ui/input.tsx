import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "w-full min-w-0 rounded-md border border-border bg-card px-3 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground/70 hover:border-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/25 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" className={cn(base, "h-11 sm:h-10", className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(base, "min-h-28 py-2 leading-6", className)} {...props} />;
}

/** Select nativo: funciona sin JavaScript y usa el selector del sistema en el celular. */
function SelectNativo({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select data-slot="select" className={cn(base, "h-11 appearance-none pr-9 sm:h-10")} {...props}>
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  );
}

export { Input, Textarea, SelectNativo };
