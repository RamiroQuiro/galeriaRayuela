CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`email` text,
	`nombre_completo` text,
	`tenant_id` text NOT NULL,
	`plan_id` text,
	`suscripcion_activa_id` integer,
	`is_admin` integer DEFAULT false,
	`is_vendor` integer DEFAULT false,
	`bio` text,
	`location` text,
	`whatsapp` text,
	`brand_name` text,
	`avatar` text,
	`instagram` text,
	`alias_mp` text,
	`cbu` text,
	`rating` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tenant_id` text NOT NULL,
	`codigo_acceso` text NOT NULL,
	`url_qr` text,
	`imagen_portada` text,
	`max_fotos` integer DEFAULT 100,
	`estado` text DEFAULT 'activo',
	`fecha_evento` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_codigo_acceso_unique` ON `events` (`codigo_acceso`);--> statement-breakpoint
CREATE TABLE `images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`path` text NOT NULL,
	`thumbnail` text,
	`nombre_invitado` text,
	`tamanio_bytes` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `planes` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text,
	`precio_mensual` integer NOT NULL,
	`max_eventos` integer NOT NULL,
	`max_fotos_por_evento` integer NOT NULL,
	`caracteristicas` text NOT NULL,
	`activo` integer DEFAULT true,
	`orden` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `suscripciones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`estado` text NOT NULL,
	`fecha_inicio` text NOT NULL,
	`fecha_fin` text,
	`metodo_pago` text,
	`id_pago_externo` text,
	`monto_pagado` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`usuario_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plan_id`) REFERENCES `planes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real NOT NULL,
	`currency` text DEFAULT 'ARS',
	`unit` text NOT NULL,
	`images` text,
	`is_active` integer DEFAULT true,
	`category` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
