ALTER TABLE `vehicle_transactions` ADD `cocardCheckoutAttemptToken` varchar(96);--> statement-breakpoint
ALTER TABLE `vehicle_transactions` ADD `cocardCheckoutAttemptedAt` timestamp;
