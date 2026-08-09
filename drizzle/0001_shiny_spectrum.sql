CREATE TABLE `commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`referralBonus` int NOT NULL DEFAULT 0,
	`residualIncome` int NOT NULL DEFAULT 0,
	`dcpMatching` int NOT NULL DEFAULT 0,
	`rankBonus` int NOT NULL DEFAULT 0,
	`total` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referralCode` varchar(32) NOT NULL,
	`rank` enum('associate','driver','road_captain','fleet_director','elite_executive','dream_ambassador') NOT NULL DEFAULT 'associate',
	`totalEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_profiles_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `referral_profiles_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredId` int NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`status` enum('pending','active','inactive') NOT NULL DEFAULT 'pending',
	`bonusPaid` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referredId_unique` UNIQUE(`referredId`)
);
