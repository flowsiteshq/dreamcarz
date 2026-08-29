ALTER TABLE `vehicle_transactions` ADD `paymentProviderTransactionId` varchar(160);--> statement-breakpoint
ALTER TABLE `vehicle_transactions` ADD `paymentProviderAuthorizationId` varchar(160);--> statement-breakpoint
ALTER TABLE `vehicle_transactions` ADD `paymentProviderCustomerVaultId` varchar(160);