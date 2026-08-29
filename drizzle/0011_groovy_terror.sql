CREATE TABLE `transaction_additional_drivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`licenseStatus` enum('not_started','pending','verified','manual_review','rejected') NOT NULL DEFAULT 'not_started',
	`identityStatus` enum('not_started','pending','verified','manual_review','rejected') NOT NULL DEFAULT 'not_started',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_additional_drivers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_agreements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`agreementType` enum('rental','purchase','addendum') NOT NULL,
	`version` varchar(64) NOT NULL,
	`provider` varchar(64),
	`providerEnvelopeId` varchar(160),
	`status` enum('draft','awaiting_signature','signed','declined','voided') NOT NULL DEFAULT 'draft',
	`signedDocumentKey` varchar(512),
	`sentAt` timestamp,
	`signedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_agreements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`userId` int NOT NULL,
	`consentType` enum('identity_biometric','identity_document','insurance_review','payment_authorization','credit_authorization','electronic_signature','communications') NOT NULL,
	`policyVersion` varchar(64) NOT NULL,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	`withdrawnAt` timestamp,
	`source` varchar(64) NOT NULL DEFAULT 'transaction_flow',
	CONSTRAINT `transaction_consents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`userId` int NOT NULL,
	`documentType` enum('insurance_card','additional_driver_license','trade_in_document','condition_photo','agreement_copy','other') NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`originalFilename` varchar(255) NOT NULL,
	`contentType` varchar(128) NOT NULL,
	`status` enum('pending','accepted','rejected','redacted') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`actorUserId` int,
	`actorType` enum('customer','admin','system','provider') NOT NULL,
	`eventType` varchar(96) NOT NULL,
	`fromStatus` varchar(64),
	`toStatus` varchar(64),
	`note` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_condition_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`stage` enum('pickup','return') NOT NULL,
	`completedByUserId` int,
	`odometerReading` int,
	`fuelLevel` varchar(32),
	`notes` text,
	`photoKeys` text,
	`status` enum('draft','submitted','reviewed','disputed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicle_condition_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`transactionType` enum('rental','purchase') NOT NULL,
	`vehicleId` varchar(96) NOT NULL,
	`vehicleName` varchar(160) NOT NULL,
	`vehicleImage` varchar(512),
	`membershipPlan` varchar(64),
	`status` enum('initiated','profile_incomplete','verification_pending','manual_review','eligibility_review','payment_pending','agreement_pending','ready_for_pickup','active_rental','return_pending','settlement_pending','completed','canceled','declined') NOT NULL DEFAULT 'initiated',
	`currentStep` varchar(64) NOT NULL DEFAULT 'vehicle',
	`contactName` varchar(160),
	`contactEmail` varchar(320),
	`contactPhone` varchar(32),
	`addressLine1` varchar(255),
	`addressLine2` varchar(255),
	`city` varchar(100),
	`state` varchar(64),
	`postalCode` varchar(24),
	`identityStatus` enum('not_started','pending','verified','requires_input','manual_review','redacted') NOT NULL DEFAULT 'not_started',
	`licenseStatus` enum('not_started','pending','verified','expired','manual_review','failed') NOT NULL DEFAULT 'not_started',
	`eligibilityStatus` enum('not_started','pending','cleared','manual_review','ineligible') NOT NULL DEFAULT 'not_started',
	`insuranceStatus` enum('not_required','pending','verified','manual_review','rejected') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('not_required','pending','authorized','paid','failed','refunded','manual_review') NOT NULL DEFAULT 'pending',
	`agreementStatus` enum('not_required','draft','awaiting_signature','signed','declined','voided') NOT NULL DEFAULT 'draft',
	`conditionStatus` enum('not_started','pickup_complete','return_complete','review_required') NOT NULL DEFAULT 'not_started',
	`pickupStatus` enum('not_applicable','pending','verified','completed','missed') NOT NULL DEFAULT 'pending',
	`returnStatus` enum('not_applicable','pending','in_progress','inspected','complete') NOT NULL DEFAULT 'not_applicable',
	`settlementStatus` enum('not_applicable','pending','complete','adjustment_required','disputed') NOT NULL DEFAULT 'not_applicable',
	`identityProvider` varchar(64),
	`identitySessionId` varchar(160),
	`paymentProvider` varchar(64),
	`stripeCustomerId` varchar(160),
	`stripePaymentIntentId` varchar(160),
	`agreementProvider` varchar(64),
	`agreementEnvelopeId` varchar(160),
	`requestedStartDate` varchar(10),
	`requestedEndDate` varchar(10),
	`pickupLocation` varchar(255),
	`deliveryLocation` varchar(255),
	`pricingSnapshot` text,
	`internalNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicle_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicle_transactions_reference_unique` UNIQUE(`reference`)
);
