ALTER TABLE `vehicle_transactions` ADD `eligibilityDetails` text;--> statement-breakpoint
ALTER TABLE `vehicle_transactions` ADD `eligibilityDetails` text;--> statement-breakpoint
ALTER TABLE `vehicle_transactions` ADD `insuranceDetails` text;--> statement-breakpoint
ALTER TABLE `vehicle_transactions` ADD `tradeInDetails` text;--> statement-breakpoint
ALTER TABLE `vehicle_transactions` ADD `purchasePaymentPath` enum('not_applicable','undecided','cash','finance') DEFAULT 'not_applicable' NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicle_transactions` ADD `financingStatus` enum('not_applicable','not_started','provider_required','submitted','approved','manual_review','declined') DEFAULT 'not_applicable' NOT NULL;
