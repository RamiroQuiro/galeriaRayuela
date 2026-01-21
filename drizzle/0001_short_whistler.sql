CREATE TABLE `whatsapp_sesiones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` text NOT NULL,
	`numero_whatsapp` text,
	`credenciales_sesion` text,
	`qr_vinculacion` text,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`fecha_vinculacion` integer,
	`ultima_actividad` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_sesiones_usuario_id_unique` ON `whatsapp_sesiones` (`usuario_id`);--> statement-breakpoint
CREATE TABLE `whatsapp_subidas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`evento_id` integer NOT NULL,
	`numero_telefono` text NOT NULL,
	`imagen_id` integer,
	`fecha_subida` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`evento_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`imagen_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`tenant_id` text NOT NULL,
	`sender_number` text,
	`text` text NOT NULL,
	`status` text DEFAULT 'aprobado' NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
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
	`nombre_fantasia` text,
	`avatar` text,
	`instagram` text,
	`alias_mp` text,
	`cbu` text,
	`rating` integer DEFAULT 0,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "password", "email", "nombre_completo", "tenant_id", "plan_id", "suscripcion_activa_id", "is_admin", "is_vendor", "bio", "location", "whatsapp", "nombre_fantasia", "avatar", "instagram", "alias_mp", "cbu", "rating", "created_at") SELECT "id", "username", "password", "email", "nombre_completo", "tenant_id", "plan_id", "suscripcion_activa_id", "is_admin", "is_vendor", "bio", "location", "whatsapp", "nombre_fantasia", "avatar", "instagram", "alias_mp", "cbu", "rating", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `__new_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tenant_id` text NOT NULL,
	`codigo_acceso` text NOT NULL,
	`url_qr` text,
	`imagen_portada` text,
	`max_fotos` integer DEFAULT 100,
	`estado` text DEFAULT 'activo',
	`whatsapp_activo` integer DEFAULT 0,
	`fecha_evento` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_events`("id", "name", "tenant_id", "codigo_acceso", "url_qr", "imagen_portada", "max_fotos", "estado", "whatsapp_activo", "fecha_evento", "created_at", "updated_at", "deleted_at") SELECT "id", "name", "tenant_id", "codigo_acceso", "url_qr", "imagen_portada", "max_fotos", "estado", "whatsapp_activo", "fecha_evento", "created_at", "updated_at", "deleted_at" FROM `events`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
ALTER TABLE `__new_events` RENAME TO `events`;--> statement-breakpoint
CREATE UNIQUE INDEX `events_codigo_acceso_unique` ON `events` (`codigo_acceso`);--> statement-breakpoint
CREATE TABLE `__new_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`path` text NOT NULL,
	`thumbnail` text,
	`nombre_invitado` text,
	`tamanio_bytes` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_images`("id", "event_id", "path", "thumbnail", "nombre_invitado", "tamanio_bytes", "created_at") SELECT "id", "event_id", "path", "thumbnail", "nombre_invitado", "tamanio_bytes", "created_at" FROM `images`;--> statement-breakpoint
DROP TABLE `images`;--> statement-breakpoint
ALTER TABLE `__new_images` RENAME TO `images`;--> statement-breakpoint
CREATE TABLE `__new_suscripciones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`estado` text NOT NULL,
	`fecha_inicio` text NOT NULL,
	`fecha_fin` text,
	`metodo_pago` text,
	`id_pago_externo` text,
	`monto_pagado` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plan_id`) REFERENCES `planes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_suscripciones`("id", "usuario_id", "plan_id", "estado", "fecha_inicio", "fecha_fin", "metodo_pago", "id_pago_externo", "monto_pagado", "created_at", "updated_at") SELECT "id", "usuario_id", "plan_id", "estado", "fecha_inicio", "fecha_fin", "metodo_pago", "id_pago_externo", "monto_pagado", "created_at", "updated_at" FROM `suscripciones`;--> statement-breakpoint
DROP TABLE `suscripciones`;--> statement-breakpoint
ALTER TABLE `__new_suscripciones` RENAME TO `suscripciones`;--> statement-breakpoint
CREATE TABLE `__new_services` (
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
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_services`("id", "tenant_id", "name", "description", "price", "currency", "unit", "images", "is_active", "category", "created_at", "updated_at") SELECT "id", "tenant_id", "name", "description", "price", "currency", "unit", "images", "is_active", "category", "created_at", "updated_at" FROM `services`;--> statement-breakpoint
DROP TABLE `services`;--> statement-breakpoint
ALTER TABLE `__new_services` RENAME TO `services`;