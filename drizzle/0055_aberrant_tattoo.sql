CREATE TABLE `associate_enrollment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`userId` int NOT NULL,
	`eventType` enum('checkout_started','initial_payment_verified','subscription_created','access_activated','payment_failed','past_due','cancelled','manual_review') NOT NULL,
	`providerReference` varchar(160),
	`detail` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `associate_enrollment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `associate_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reference` varchar(40) NOT NULL,
	`status` enum('checkout_pending','active','past_due','cancelled','manual_review') NOT NULL DEFAULT 'checkout_pending',
	`enrollmentFeeCents` int NOT NULL DEFAULT 14900,
	`monthlyFeeCents` int NOT NULL DEFAULT 4900,
	`recurringConsentAt` timestamp NOT NULL,
	`initialGatewayTransactionId` varchar(128),
	`customerVaultId` varchar(160),
	`gatewaySubscriptionId` varchar(160),
	`activatedAt` timestamp,
	`nextBillingAt` timestamp,
	`providerVerifiedAt` timestamp,
	`cancelledAt` timestamp,
	`manualReviewReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `associate_enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `associate_enrollments_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `associate_enrollments_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE INDEX `associate_enrollment_event_owner_idx` ON `associate_enrollment_events` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `associate_enrollment_event_enrollment_idx` ON `associate_enrollment_events` (`enrollmentId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `associate_enrollment_status_idx` ON `associate_enrollments` (`status`);--> statement-breakpoint
CREATE INDEX `associate_enrollment_gateway_subscription_idx` ON `associate_enrollments` (`gatewaySubscriptionId`);