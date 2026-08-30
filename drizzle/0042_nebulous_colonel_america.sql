CREATE TABLE `role_assignment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleAssignmentId` int NOT NULL,
	`targetUserId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`role` enum('customer','associate','fleet_partner','operations','support','manager','administrator') NOT NULL,
	`eventType` enum('role_granted','role_restored','role_revoked') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `role_assignment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `role_assignment_events_target_created_idx` ON `role_assignment_events` (`targetUserId`,`createdAt`);