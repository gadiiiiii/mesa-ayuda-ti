"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!bg-foreground !text-background !border-none !rounded-lg !font-semibold",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
