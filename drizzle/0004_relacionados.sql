CREATE TABLE "problemas" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text,
	"estado" text DEFAULT 'abierto' NOT NULL,
	"causa" text,
	"solucion" text,
	"autor" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"resuelto_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "duplicado_de" integer;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "problema_id" integer;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_duplicado_de_tickets_id_fk" FOREIGN KEY ("duplicado_de") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_problema_id_problemas_id_fk" FOREIGN KEY ("problema_id") REFERENCES "public"."problemas"("id") ON DELETE set null ON UPDATE no action;