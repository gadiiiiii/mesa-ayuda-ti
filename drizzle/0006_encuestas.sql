CREATE TABLE "encuestas" (
	"ticket_id" integer PRIMARY KEY NOT NULL,
	"nota" integer NOT NULL,
	"comentario" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "encuestas" ADD CONSTRAINT "encuestas_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;