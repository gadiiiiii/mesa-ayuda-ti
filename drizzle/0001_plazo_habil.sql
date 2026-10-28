ALTER TABLE "tickets" ADD COLUMN "pausado_desde" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "minutos_pausa" integer DEFAULT 0 NOT NULL;