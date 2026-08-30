ALTER TABLE `transaction_schedules` ADD `scheduledHandoffAt` timestamp;--> statement-breakpoint
ALTER TABLE `transaction_schedules` ADD `scheduledHandoffAt` timestamp;--> statement-breakpoint
ALTER TABLE `transaction_schedules` ADD `assignedDriverName` varchar(160);--> statement-breakpoint
ALTER TABLE `transaction_schedules` ADD `handoffStatus` enum('not_scheduled','scheduled','en_route','arrived','customer_verified','completed','missed','cancelled') DEFAULT 'not_scheduled' NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_schedules` ADD `handoffNotes` text;
