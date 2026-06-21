-- Custom SQL migration file, put your code below! --

-- Zero Sync upstream publication.
--
-- Zero (zero-cache) verifies on boot that every publication named in
-- ZERO_APP_PUBLICATIONS already exists, and errors otherwise. So the app owns
-- creating it, and this migration must run before the zero-sync pod boots.
-- The name MUST match ZERO_APP_PUBLICATIONS in the k8s overlay
-- (`application_boilerplate_zero_data`). `widgets` has a primary key, which
-- serves as its REPLICA IDENTITY for logical replication.
DROP PUBLICATION IF EXISTS "application_boilerplate_zero_data";
--> statement-breakpoint
CREATE PUBLICATION "application_boilerplate_zero_data" FOR TABLE "widgets";
