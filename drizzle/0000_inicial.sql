CREATE TABLE "equipos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"tipo" text NOT NULL,
	"marca" text NOT NULL,
	"modelo" text NOT NULL,
	"serie" text,
	"unidad" text NOT NULL,
	"responsable" text,
	"estado" text DEFAULT 'en_uso' NOT NULL,
	"ip" text,
	"mac" text,
	"fecha_compra" date,
	"notas" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "equipos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "eventos" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"autor" text NOT NULL,
	"texto" text,
	"desde" text,
	"hacia" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text NOT NULL,
	"solicitante" text NOT NULL,
	"unidad" text NOT NULL,
	"categoria" text NOT NULL,
	"prioridad" text NOT NULL,
	"estado" text DEFAULT 'abierto' NOT NULL,
	"tecnico" text,
	"equipo_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"vence_en" timestamp with time zone NOT NULL,
	"resuelto_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_equipo_id_equipos_id_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "equipos_unidad_idx" ON "equipos" USING btree ("unidad");--> statement-breakpoint
CREATE INDEX "eventos_ticket_idx" ON "eventos" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "tickets_estado_idx" ON "tickets" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "tickets_equipo_idx" ON "tickets" USING btree ("equipo_id");