CREATE TABLE `outputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`uploadId` int,
	`outputKey` varchar(512),
	`outputUrl` varchar(1024),
	`toolType` enum('presentation','logo','voice','video','coding') NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`fileType` varchar(64) NOT NULL,
	`toolType` enum('presentation','logo','voice','video','coding') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uploads_id` PRIMARY KEY(`id`)
);
