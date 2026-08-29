ALTER TABLE `transaction_events` ADD `providerEventId` varchar(160);
--> statement-breakpoint
ALTER TABLE `transaction_events` ADD CONSTRAINT `transaction_events_providerEventId_unique` UNIQUE(`providerEventId`);
