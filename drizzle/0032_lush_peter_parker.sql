ALTER TABLE `transaction_documents` ADD `conditionStage` enum('pickup','return');--> statement-breakpoint
ALTER TABLE `transaction_documents` ADD `conditionStage` enum('pickup','return');
ALTER TABLE `transaction_documents` ADD `conditionEvidenceView` enum('front','rear','driver_side','passenger_side','interior','odometer');
