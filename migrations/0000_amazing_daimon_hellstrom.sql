DO $$ BEGIN
 CREATE TYPE "ban_oder" AS ENUM('ABABAB', 'ABBAAB');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "cash_metric" AS ENUM('fixed', 'percent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "issue_type" AS ENUM('security', 'enhancement', 'new_feature', 'bug', 'user_behavior');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "join_request_status" AS ENUM('pending', 'accepted', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "mappool_state" AS ENUM('private', 'playtesting', 'public');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "mod" AS ENUM('ez', 'hd', 'hr', 'sd', 'dt', 'rx', 'ht', 'fl', 'pf');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "notification_issue_type" AS ENUM('submission', 'resolved');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "notification_round_publication_type" AS ENUM('mappool', 'schedules', 'statistics');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "notification_staff_change_action" AS ENUM('added', 'removed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "notification_team_change_action" AS ENUM('joined', 'left', 'kicked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "opponent" AS ENUM('opponent1', 'opponent2');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "prize_type" AS ENUM('tournament', 'pickems');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "qualifier_runs_summary" AS ENUM('average', 'sum', 'best');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "skillset" AS ENUM('consistency', 'streams', 'tech', 'alt', 'speed', 'gimmick', 'rhythm', 'aim', 'awkward_aim', 'flow_aim', 'reading', 'precision', 'stamina', 'finger_control', 'jack_of_all_trades');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "staff_color" AS ENUM('slate', 'gray', 'red', 'orange', 'yellow', 'lime', 'green', 'emerald', 'cyan', 'blue', 'indigo', 'purple', 'fuchsia', 'pink');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "staff_permission" AS ENUM('host', 'mutate_tournament', 'view_staff_members', 'mutate_staff_members', 'delete_staff_members', 'view_player_regs', 'mutate_player_regs', 'delete_player_regs', 'view_pool_structure', 'mutate_pool_structure', 'view_pool_suggestions', 'mutate_pool_suggestions', 'delete_pool_suggestions', 'view_pooled_maps', 'delete_pooled_maps', 'view_maps_to_playtest', 'mutate_maps_to_playtest', 'delete_maps_to_playtest', 'view_matches', 'mutate_matches', 'delete_matches', 'ref_matches', 'commentate_matches', 'stream_matches', 'view_stats', 'mutate_stats', 'delete_stats', 'can_play');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "stage_format" AS ENUM('groups', 'swiss', 'qualifiers', 'single_elim', 'double_elim', 'battle_royale');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "tournament_service" AS ENUM('registrations', 'mappooling', 'referee', 'stats', 'pickems');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "tournament_type" AS ENUM('teams', 'draft', 'solo');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "user_theme" AS ENUM('light', 'dark');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "win_condition" AS ENUM('score', 'accuracy', 'combo', 'misses');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(35) NOT NULL,
	"code" char(2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchased_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"cost" numeric(4, 2) NOT NULL,
	"paypal_order_id" varchar(20) NOT NULL,
	"services" tournament_service[5] DEFAULT ARRAY[]::tournament_service[] NOT NULL,
	"purchased_by_id" integer NOT NULL,
	"for_tournament_id" integer
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"registered_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"osu_user_id" integer NOT NULL,
	"osu_username" varchar(16) NOT NULL,
	"is_restricted" boolean,
	"discord_user_id" varchar(19) NOT NULL,
	"discord_username" varchar(32) NOT NULL,
	"discord_discriminator" char(4) NOT NULL,
	"api_key" varchar(24) NOT NULL,
	"free_services_left" smallint DEFAULT 3 NOT NULL,
	"osu_access_token" text NOT NULL,
	"osu_refresh_token" text NOT NULL,
	"discord_access_token" text NOT NULL,
	"discord_refresh_token" text NOT NULL,
	"theme" user_theme DEFAULT 'dark' NOT NULL,
	"show_discord_tag" boolean DEFAULT true,
	"country_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "battle_royale_rounds" (
	"players_eliminated_per_map" smallint NOT NULL,
	"round_id" integer PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "prizes" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" prize_type NOT NULL,
	"positons" smallint[] DEFAULT ARRAY[]::smallint[] NOT NULL,
	"trophy" boolean NOT NULL,
	"medal" boolean NOT NULL,
	"badge" boolean NOT NULL,
	"banner" boolean NOT NULL,
	"additional_items" varchar(25)[] DEFAULT ARRAY[]::varchar[] NOT NULL,
	"months_osu_supporter" smallint,
	"tournament_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "prize_cash" (
	"value" real NOT NULL,
	"metric" cash_metric NOT NULL,
	"currency" char(3) NOT NULL,
	"in_prize_id" integer PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "qualifier_rounds" (
	"publish_mp_links" boolean DEFAULT false NOT NULL,
	"run_count" smallint NOT NULL,
	"summarize_runs_as" qualifier_runs_summary DEFAULT 'average' NOT NULL,
	"round_id" integer PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(20) NOT NULL,
	"order" smallint NOT NULL,
	"target_star_rating" real,
	"mappool_state" mappool_state DEFAULT 'private' NOT NULL,
	"publish_schedules" boolean DEFAULT false NOT NULL,
	"publish_stats" boolean DEFAULT false NOT NULL,
	"stage_id" integer NOT NULL,
	"tournament_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"format" stage_format NOT NULL,
	"order" smallint NOT NULL,
	"is_main_stage" boolean DEFAULT false NOT NULL,
	"tournament_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "standard_rounds" (
	"best_of" smallint NOT NULL,
	"ban_count" smallint NOT NULL,
	"round_id" integer PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"acronym" varchar(8) NOT NULL,
	"lower_rank_range" integer NOT NULL,
	"upper_rank_range" integer NOT NULL,
	"go_public_on" timestamp (3) with time zone,
	"concludes_on" timestamp (3) with time zone,
	"player_regs_open_on" timestamp (3) with time zone,
	"player_regs_close_on" timestamp (3) with time zone,
	"staff_regs_open_on" timestamp (3) with time zone,
	"staff_regs_close_on" timestamp (3) with time zone,
	"team_size" smallint DEFAULT 1 NOT NULL,
	"team_play_size" smallint DEFAULT 1 NOT NULL,
	"has_banner" boolean DEFAULT false,
	"use_bws" boolean NOT NULL,
	"rules" text,
	"type" tournament_type NOT NULL,
	"services" tournament_service[5] DEFAULT ARRAY[]::tournament_service[] NOT NULL,
	"forum_post_id" integer,
	"discord_invite_id" varchar(12),
	"main_sheet_id" varchar(45),
	"twitch_channel_name" varchar(25),
	"youtube_channel_id" varchar(25),
	"twitter_handle" varchar(15),
	"donation_link" varchar(100),
	"website_link" varchar(100),
	"pick_timer_length" smallint DEFAULT 120 NOT NULL,
	"start_timer_length" smallint DEFAULT 10 NOT NULL,
	"double_pick_allowed" boolean DEFAULT false NOT NULL,
	"double_ban_allowed" boolean DEFAULT false NOT NULL,
	"always_force_nofail" boolean DEFAULT true NOT NULL,
	"roll_rules" text,
	"free_mod_rules" text,
	"warmup_rules" text,
	"late_procedures" text,
	"ban_order" ban_oder DEFAULT 'ABABAB' NOT NULL,
	"win_condition" win_condition DEFAULT 'score' NOT NULL
);

CREATE TABLE IF NOT EXISTS "join_team_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"requested_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"status" join_request_status DEFAULT 'pending' NOT NULL,
	"sent_by_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"registered_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"availability" char(99) NOT NULL,
	"tournament_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer,
	"prize_won_id" integer
);

CREATE TABLE IF NOT EXISTS "staff_application_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(25) NOT NULL,
	"description" text,
	"staff_application_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "staff_application_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"applying_for" varchar(25)[] DEFAULT ARRAY[]::varchar[] NOT NULL,
	"status" join_request_status DEFAULT 'pending' NOT NULL,
	"staffing_experience" text NOT NULL,
	"additional_comments" text,
	"staff_application_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "staff_applications" (
	"title" varchar(75) NOT NULL,
	"description" text,
	"tournament_id" integer PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "staff_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tournament_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "staff_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(25) NOT NULL,
	"color" staff_color DEFAULT 'slate' NOT NULL,
	"permissions" staff_permission[28] DEFAULT ARRAY[]::staff_permission[] NOT NULL,
	"tournament_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"registered_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"name" varchar(20) NOT NULL,
	"invite_id" char(8) NOT NULL,
	"has_banner" boolean DEFAULT false NOT NULL,
	"tournament_id" integer NOT NULL,
	"captain_id" integer NOT NULL,
	"prize_won_id" integer
);

CREATE TABLE IF NOT EXISTS "knockout_lobby_to_player" (
	"knockout_lobby_id" integer NOT NULL,
	"player_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knockout_lobby_to_player" ADD CONSTRAINT "knockout_lobby_to_player_knockout_lobby_id_player_id" PRIMARY KEY("knockout_lobby_id","player_id");

CREATE TABLE IF NOT EXISTS "knockout_lobby_to_team" (
	"knockout_lobby_id" integer NOT NULL,
	"team_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knockout_lobby_to_team" ADD CONSTRAINT "knockout_lobby_to_team_knockout_lobby_id_team_id" PRIMARY KEY("knockout_lobby_id","team_id");

CREATE TABLE IF NOT EXISTS "lobby_to_staff_member_as_commentator" (
	"lobby_id" integer NOT NULL,
	"staff_member_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lobby_to_staff_member_as_commentator" ADD CONSTRAINT "lobby_to_staff_member_as_commentator_staff_member_id_lobby_id" PRIMARY KEY("staff_member_id","lobby_id");

CREATE TABLE IF NOT EXISTS "lobby_to_staff_member_as_referee" (
	"lobby_id" integer NOT NULL,
	"staff_member_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lobby_to_staff_member_as_referee" ADD CONSTRAINT "lobby_to_staff_member_as_referee_staff_member_id_lobby_id" PRIMARY KEY("staff_member_id","lobby_id");

CREATE TABLE IF NOT EXISTS "lobby_to_staff_member_as_streamer" (
	"lobby_id" integer NOT NULL,
	"staff_member_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lobby_to_staff_member_as_streamer" ADD CONSTRAINT "lobby_to_staff_member_as_streamer_staff_member_id_lobby_id" PRIMARY KEY("staff_member_id","lobby_id");

CREATE TABLE IF NOT EXISTS "played_knockout_map_to_player_as_knocked_out" (
	"played_knockout_map_id" integer NOT NULL,
	"player_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "played_knockout_map_to_player_as_knocked_out" ADD CONSTRAINT "played_knockout_map_to_player_as_knocked_out_played_knockout_map_id_player_id" PRIMARY KEY("played_knockout_map_id","player_id");

CREATE TABLE IF NOT EXISTS "played_knockout_map_to_player_as_played" (
	"played_knockout_map_id" integer NOT NULL,
	"player_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "played_knockout_map_to_player_as_played" ADD CONSTRAINT "played_knockout_map_to_player_as_played_played_knockout_map_id_player_id" PRIMARY KEY("played_knockout_map_id","player_id");

CREATE TABLE IF NOT EXISTS "played_knockout_map_to_team_as_knocked_out" (
	"played_knockout_map_id" integer NOT NULL,
	"team_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "played_knockout_map_to_team_as_knocked_out" ADD CONSTRAINT "played_knockout_map_to_team_as_knocked_out_played_knockout_map_id_team_id" PRIMARY KEY("played_knockout_map_id","team_id");

CREATE TABLE IF NOT EXISTS "played_knockout_map_to_team_as_played" (
	"played_knockout_map_id" integer NOT NULL,
	"team_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "played_knockout_map_to_team_as_played" ADD CONSTRAINT "played_knockout_map_to_team_as_played_played_knockout_map_id_team_id" PRIMARY KEY("played_knockout_map_id","team_id");

CREATE TABLE IF NOT EXISTS "played_qualifier_map_to_player" (
	"played_qualifier_map_id" integer NOT NULL,
	"player_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "played_qualifier_map_to_player" ADD CONSTRAINT "played_qualifier_map_to_player_played_qualifier_map_id_player_id" PRIMARY KEY("played_qualifier_map_id","player_id");

CREATE TABLE IF NOT EXISTS "played_qualifier_map_to_team" (
	"played_qualifier_map_id" integer NOT NULL,
	"team_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "played_qualifier_map_to_team" ADD CONSTRAINT "played_qualifier_map_to_team_played_qualifier_map_id_team_id" PRIMARY KEY("played_qualifier_map_id","team_id");

CREATE TABLE IF NOT EXISTS "qualifier_lobby_to_player" (
	"qualifier_lobby_id" integer NOT NULL,
	"player_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "qualifier_lobby_to_player" ADD CONSTRAINT "qualifier_lobby_to_player_qualifier_lobby_id_player_id" PRIMARY KEY("qualifier_lobby_id","player_id");

CREATE TABLE IF NOT EXISTS "qualifier_lobby_to_team" (
	"qualifier_lobby_id" integer NOT NULL,
	"team_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "qualifier_lobby_to_team" ADD CONSTRAINT "qualifier_lobby_to_team_qualifier_lobby_id_team_id" PRIMARY KEY("qualifier_lobby_id","team_id");

CREATE TABLE IF NOT EXISTS "staff_member_to_staff_role" (
	"staff_member_id" integer NOT NULL,
	"staff_role_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staff_member_to_staff_role" ADD CONSTRAINT "staff_member_to_staff_role_staff_member_id_staff_role_id" PRIMARY KEY("staff_member_id","staff_role_id");

CREATE TABLE IF NOT EXISTS "beatmaps" (
	"osu_beatmap_id" integer PRIMARY KEY NOT NULL,
	"difficulty_name" varchar(75) NOT NULL,
	"max_combo" smallint NOT NULL,
	"bpm" real NOT NULL,
	"length" real NOT NULL,
	"circle_size" real NOT NULL,
	"approach_rate" real NOT NULL,
	"overall_difficulty" real NOT NULL,
	"health_points" real NOT NULL,
	"beatmapset_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "beatmapsets" (
	"osu_beatmapset_id" integer PRIMARY KEY NOT NULL,
	"artist" varchar(70) NOT NULL,
	"title" varchar(180) NOT NULL,
	"mapper_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "mappers" (
	"osu_user_id" integer PRIMARY KEY NOT NULL,
	"username" varchar(16) NOT NULL
);

CREATE TABLE IF NOT EXISTS "modpools" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(3) NOT NULL,
	"mods" mod[4] DEFAULT ARRAY[]::mod[] NOT NULL,
	"is_free_mod" boolean NOT NULL,
	"order" smallint NOT NULL,
	"map_count" smallint,
	"round_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "pooled_maps" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot" smallint NOT NULL,
	"skillsets" skillset[3] DEFAULT ARRAY[]::skillset[] NOT NULL,
	"pooler_comment" text,
	"has_beatmap_file" boolean DEFAULT false NOT NULL,
	"has_replay" boolean DEFAULT false NOT NULL,
	"tournament_id" integer NOT NULL,
	"round_id" integer NOT NULL,
	"modpool_id" integer NOT NULL,
	"beatmap_id" integer NOT NULL,
	"suggested_by_staff_member_id" integer,
	"pooled_by_staff_member_id" integer
);

CREATE TABLE IF NOT EXISTS "pooled_map_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating" numeric(3, 1) NOT NULL,
	"for_pooled_map_id" integer NOT NULL,
	"given_by_staff_member_id" integer
);

CREATE TABLE IF NOT EXISTS "star_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"mods" mod[4] DEFAULT ARRAY[]::mod[] NOT NULL,
	"value" real NOT NULL,
	"beatmap_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "suggested_maps" (
	"id" serial PRIMARY KEY NOT NULL,
	"suggested_skillset" skillset[3] DEFAULT ARRAY[]::skillset[] NOT NULL,
	"suggester_comment" text,
	"tournament_id" integer NOT NULL,
	"round_id" integer NOT NULL,
	"modpool_id" integer NOT NULL,
	"beatmap_id" integer NOT NULL,
	"suggested_by_staff_member_id" integer
);

CREATE TABLE IF NOT EXISTS "banned_maps" (
	"id" serial PRIMARY KEY NOT NULL,
	"banned_by" opponent NOT NULL,
	"pooled_map_id" integer,
	"match_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "knockout_lobbies" (
	"lobby_id" integer PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "lobbies" (
	"id" serial PRIMARY KEY NOT NULL,
	"local_id" varchar(5),
	"date" timestamp (3) with time zone,
	"referee_notes" text,
	"osu_mp_ids" integer[] DEFAULT ARRAY[]::integer[] NOT NULL,
	"tournament_id" integer NOT NULL,
	"round_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "matches" (
	"roll_winner" opponent,
	"ban_first" opponent,
	"pick_first" opponent,
	"forfeit_from" opponent,
	"winner" opponent,
	"lobby_id" integer PRIMARY KEY NOT NULL,
	"player_1_id" integer,
	"player_2_id" integer,
	"team_1_id" integer,
	"team_2_id" integer
);

CREATE TABLE IF NOT EXISTS "played_knockout_maps" (
	"id" serial PRIMARY KEY NOT NULL,
	"knockout_lobby_id" integer NOT NULL,
	"pooled_map_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "played_maps" (
	"id" serial PRIMARY KEY NOT NULL,
	"winner" opponent NOT NULL,
	"picked_by" opponent NOT NULL,
	"pooled_map_id" integer,
	"match_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "played_qualifier_maps" (
	"id" serial PRIMARY KEY NOT NULL,
	"qualifier_lobby_id" integer NOT NULL,
	"pooled_map_id" integer
);

CREATE TABLE IF NOT EXISTS "potential_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"local_id" varchar(5),
	"date" timestamp (3) with time zone,
	"match_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	"player_1_id" integer,
	"player_2_id" integer,
	"team_1_id" integer,
	"team_2_id" integer
);

CREATE TABLE IF NOT EXISTS "qualifier_lobbies" (
	"lobby_id" integer PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "mod_multipliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"mods" mod[4] DEFAULT ARRAY[]::mod[] NOT NULL,
	"value" real NOT NULL,
	"tournament_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "player_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"score" integer NOT NULL,
	"accuracy" real NOT NULL,
	"combo" smallint NOT NULL,
	"count_300" smallint NOT NULL,
	"count_100" smallint NOT NULL,
	"count_50" smallint NOT NULL,
	"misses" smallint NOT NULL,
	"relative_score" double precision DEFAULT 0 NOT NULL,
	"z_score" double precision DEFAULT 0 NOT NULL,
	"mods" mod[4] DEFAULT ARRAY[]::mod[] NOT NULL,
	"on_pooled_map_id" integer NOT NULL,
	"round_id" integer NOT NULL,
	"team_score_id" integer NOT NULL,
	"player_id" integer
);

CREATE TABLE IF NOT EXISTS "team_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"on_pooled_map_id" integer NOT NULL,
	"round_id" integer NOT NULL,
	"team_id" integer
);

CREATE TABLE IF NOT EXISTS "match_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"predicted_winner" opponent NOT NULL,
	"match_id" integer NOT NULL,
	"submission_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "pickem_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"points" smallint DEFAULT 0 NOT NULL,
	"user_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	"prize_won_id" integer
);

CREATE TABLE IF NOT EXISTS "potential_match_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"predicted_winner" opponent NOT NULL,
	"potential_match_id" integer NOT NULL,
	"submission_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "prediction_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"submitted_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"tournament_id" integer NOT NULL,
	"round_id" integer NOT NULL,
	"submitted_by_pickem_user_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "qualifier_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"predicted_position" smallint NOT NULL,
	"submission_id" integer NOT NULL,
	"player_id" integer,
	"team_id" integer
);

CREATE TABLE IF NOT EXISTS "granted_tournament_host_notifications" (
	"notification_id" integer PRIMARY KEY NOT NULL,
	"previous_host_id" integer,
	"new_host_id" integer
);

CREATE TABLE IF NOT EXISTS "issue_notifications" (
	"notification_type" notification_issue_type NOT NULL,
	"notification_id" integer PRIMARY KEY NOT NULL,
	"issue_id" integer
);

CREATE TABLE IF NOT EXISTS "join_team_request_notifications" (
	"notification_id" integer PRIMARY KEY NOT NULL,
	"request_id" integer
);

CREATE TABLE IF NOT EXISTS "new_staff_application_submission_notifications" (
	"notification_id" integer PRIMARY KEY NOT NULL,
	"staff_application_submission_id" integer
);

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"notified_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "round_publication_notifications" (
	"publicized" notification_round_publication_type NOT NULL,
	"notification_id" integer PRIMARY KEY NOT NULL,
	"round_id" integer
);

CREATE TABLE IF NOT EXISTS "staff_change_notifications" (
	"action" notification_staff_change_action NOT NULL,
	"added_with_roles" varchar(25)[] DEFAULT ARRAY[]::varchar[] NOT NULL,
	"notification_id" integer PRIMARY KEY NOT NULL,
	"user_id" integer
);

CREATE TABLE IF NOT EXISTS "team_change_notifications" (
	"action" notification_team_change_action NOT NULL,
	"notification_id" integer PRIMARY KEY NOT NULL,
	"team_id" integer,
	"affected_user_id" integer,
	"kicked_by_id" integer
);

CREATE TABLE IF NOT EXISTS "tournament_deleted_notifications" (
	"tournament_name" varchar(50) NOT NULL,
	"notification_id" integer PRIMARY KEY NOT NULL,
	"hosted_by_id" integer
);

CREATE TABLE IF NOT EXISTS "issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"submitted_on" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"title" varchar(35) NOT NULL,
	"body" text NOT NULL,
	"type" issue_type NOT NULL,
	"image_count" smallint DEFAULT 0 NOT NULL,
	"can_contact" boolean DEFAULT false NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"submitted_by_id" integer
);

DO $$ BEGIN
 ALTER TABLE "purchases" ADD CONSTRAINT "purchases_purchased_by_id_users_id_fk" FOREIGN KEY ("purchased_by_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "purchases" ADD CONSTRAINT "purchases_for_tournament_id_tournaments_id_fk" FOREIGN KEY ("for_tournament_id") REFERENCES "tournaments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "battle_royale_rounds" ADD CONSTRAINT "battle_royale_rounds_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "prizes" ADD CONSTRAINT "prizes_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "prize_cash" ADD CONSTRAINT "prize_cash_in_prize_id_prizes_id_fk" FOREIGN KEY ("in_prize_id") REFERENCES "prizes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "qualifier_rounds" ADD CONSTRAINT "qualifier_rounds_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "rounds" ADD CONSTRAINT "rounds_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "rounds" ADD CONSTRAINT "rounds_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "stages" ADD CONSTRAINT "stages_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "standard_rounds" ADD CONSTRAINT "standard_rounds_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "join_team_requests" ADD CONSTRAINT "join_team_requests_sent_by_id_players_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_prize_won_id_prizes_id_fk" FOREIGN KEY ("prize_won_id") REFERENCES "prizes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "staff_application_roles" ADD CONSTRAINT "staff_application_roles_staff_application_id_staff_applications_tournament_id_fk" FOREIGN KEY ("staff_application_id") REFERENCES "staff_applications"("tournament_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "staff_application_submissions" ADD CONSTRAINT "staff_application_submissions_staff_application_id_staff_applications_tournament_id_fk" FOREIGN KEY ("staff_application_id") REFERENCES "staff_applications"("tournament_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "staff_applications" ADD CONSTRAINT "staff_applications_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "staff_roles" ADD CONSTRAINT "staff_roles_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "teams" ADD CONSTRAINT "teams_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "teams" ADD CONSTRAINT "teams_captain_id_players_id_fk" FOREIGN KEY ("captain_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "teams" ADD CONSTRAINT "teams_prize_won_id_prizes_id_fk" FOREIGN KEY ("prize_won_id") REFERENCES "prizes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "knockout_lobby_to_player" ADD CONSTRAINT "knockout_lobby_to_player_knockout_lobby_id_knockout_lobbies_lobby_id_fk" FOREIGN KEY ("knockout_lobby_id") REFERENCES "knockout_lobbies"("lobby_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "knockout_lobby_to_player" ADD CONSTRAINT "knockout_lobby_to_player_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "knockout_lobby_to_team" ADD CONSTRAINT "knockout_lobby_to_team_knockout_lobby_id_knockout_lobbies_lobby_id_fk" FOREIGN KEY ("knockout_lobby_id") REFERENCES "knockout_lobbies"("lobby_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "knockout_lobby_to_team" ADD CONSTRAINT "knockout_lobby_to_team_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lobby_to_staff_member_as_commentator" ADD CONSTRAINT "lobby_to_staff_member_as_commentator_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobbies"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lobby_to_staff_member_as_commentator" ADD CONSTRAINT "lobby_to_staff_member_as_commentator_staff_member_id_staff_members_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lobby_to_staff_member_as_referee" ADD CONSTRAINT "lobby_to_staff_member_as_referee_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobbies"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lobby_to_staff_member_as_referee" ADD CONSTRAINT "lobby_to_staff_member_as_referee_staff_member_id_staff_members_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lobby_to_staff_member_as_streamer" ADD CONSTRAINT "lobby_to_staff_member_as_streamer_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobbies"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lobby_to_staff_member_as_streamer" ADD CONSTRAINT "lobby_to_staff_member_as_streamer_staff_member_id_staff_members_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_player_as_knocked_out" ADD CONSTRAINT "played_knockout_map_to_player_as_knocked_out_played_knockout_map_id_played_knockout_maps_id_fk" FOREIGN KEY ("played_knockout_map_id") REFERENCES "played_knockout_maps"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_player_as_knocked_out" ADD CONSTRAINT "played_knockout_map_to_player_as_knocked_out_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_player_as_played" ADD CONSTRAINT "played_knockout_map_to_player_as_played_played_knockout_map_id_played_knockout_maps_id_fk" FOREIGN KEY ("played_knockout_map_id") REFERENCES "played_knockout_maps"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_player_as_played" ADD CONSTRAINT "played_knockout_map_to_player_as_played_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_team_as_knocked_out" ADD CONSTRAINT "played_knockout_map_to_team_as_knocked_out_played_knockout_map_id_played_knockout_maps_id_fk" FOREIGN KEY ("played_knockout_map_id") REFERENCES "played_knockout_maps"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_team_as_knocked_out" ADD CONSTRAINT "played_knockout_map_to_team_as_knocked_out_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_team_as_played" ADD CONSTRAINT "played_knockout_map_to_team_as_played_played_knockout_map_id_played_knockout_maps_id_fk" FOREIGN KEY ("played_knockout_map_id") REFERENCES "played_knockout_maps"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_team_as_played" ADD CONSTRAINT "played_knockout_map_to_team_as_played_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_qualifier_map_to_player" ADD CONSTRAINT "played_qualifier_map_to_player_played_qualifier_map_id_played_qualifier_maps_id_fk" FOREIGN KEY ("played_qualifier_map_id") REFERENCES "played_qualifier_maps"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_qualifier_map_to_player" ADD CONSTRAINT "played_qualifier_map_to_player_player_id_teams_id_fk" FOREIGN KEY ("player_id") REFERENCES "teams"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_qualifier_map_to_team" ADD CONSTRAINT "played_qualifier_map_to_team_played_qualifier_map_id_played_qualifier_maps_id_fk" FOREIGN KEY ("played_qualifier_map_id") REFERENCES "played_qualifier_maps"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_qualifier_map_to_team" ADD CONSTRAINT "played_qualifier_map_to_team_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "qualifier_lobby_to_player" ADD CONSTRAINT "qualifier_lobby_to_player_qualifier_lobby_id_qualifier_lobbies_lobby_id_fk" FOREIGN KEY ("qualifier_lobby_id") REFERENCES "qualifier_lobbies"("lobby_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "qualifier_lobby_to_player" ADD CONSTRAINT "qualifier_lobby_to_player_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "qualifier_lobby_to_team" ADD CONSTRAINT "qualifier_lobby_to_team_qualifier_lobby_id_qualifier_lobbies_lobby_id_fk" FOREIGN KEY ("qualifier_lobby_id") REFERENCES "qualifier_lobbies"("lobby_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "qualifier_lobby_to_team" ADD CONSTRAINT "qualifier_lobby_to_team_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "staff_member_to_staff_role" ADD CONSTRAINT "staff_member_to_staff_role_staff_member_id_staff_members_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "staff_member_to_staff_role" ADD CONSTRAINT "staff_member_to_staff_role_staff_role_id_staff_roles_id_fk" FOREIGN KEY ("staff_role_id") REFERENCES "staff_roles"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "beatmaps" ADD CONSTRAINT "beatmaps_beatmapset_id_beatmapsets_osu_beatmapset_id_fk" FOREIGN KEY ("beatmapset_id") REFERENCES "beatmapsets"("osu_beatmapset_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "beatmapsets" ADD CONSTRAINT "beatmapsets_mapper_id_mappers_osu_user_id_fk" FOREIGN KEY ("mapper_id") REFERENCES "mappers"("osu_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "modpools" ADD CONSTRAINT "modpools_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pooled_maps" ADD CONSTRAINT "pooled_maps_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pooled_maps" ADD CONSTRAINT "pooled_maps_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pooled_maps" ADD CONSTRAINT "pooled_maps_modpool_id_modpools_id_fk" FOREIGN KEY ("modpool_id") REFERENCES "modpools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pooled_maps" ADD CONSTRAINT "pooled_maps_beatmap_id_beatmaps_osu_beatmap_id_fk" FOREIGN KEY ("beatmap_id") REFERENCES "beatmaps"("osu_beatmap_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pooled_maps" ADD CONSTRAINT "pooled_maps_suggested_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("suggested_by_staff_member_id") REFERENCES "staff_members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pooled_maps" ADD CONSTRAINT "pooled_maps_pooled_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("pooled_by_staff_member_id") REFERENCES "staff_members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pooled_map_ratings" ADD CONSTRAINT "pooled_map_ratings_for_pooled_map_id_pooled_maps_id_fk" FOREIGN KEY ("for_pooled_map_id") REFERENCES "pooled_maps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pooled_map_ratings" ADD CONSTRAINT "pooled_map_ratings_given_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("given_by_staff_member_id") REFERENCES "staff_members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "star_ratings" ADD CONSTRAINT "star_ratings_beatmap_id_beatmaps_osu_beatmap_id_fk" FOREIGN KEY ("beatmap_id") REFERENCES "beatmaps"("osu_beatmap_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "suggested_maps" ADD CONSTRAINT "suggested_maps_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "suggested_maps" ADD CONSTRAINT "suggested_maps_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "suggested_maps" ADD CONSTRAINT "suggested_maps_modpool_id_modpools_id_fk" FOREIGN KEY ("modpool_id") REFERENCES "modpools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "suggested_maps" ADD CONSTRAINT "suggested_maps_beatmap_id_beatmaps_osu_beatmap_id_fk" FOREIGN KEY ("beatmap_id") REFERENCES "beatmaps"("osu_beatmap_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "suggested_maps" ADD CONSTRAINT "suggested_maps_suggested_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("suggested_by_staff_member_id") REFERENCES "staff_members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "banned_maps" ADD CONSTRAINT "banned_maps_pooled_map_id_pooled_maps_id_fk" FOREIGN KEY ("pooled_map_id") REFERENCES "pooled_maps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "banned_maps" ADD CONSTRAINT "banned_maps_match_id_matches_lobby_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("lobby_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "knockout_lobbies" ADD CONSTRAINT "knockout_lobbies_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobbies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lobbies" ADD CONSTRAINT "lobbies_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lobbies" ADD CONSTRAINT "lobbies_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobbies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_player_1_id_players_id_fk" FOREIGN KEY ("player_1_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_player_2_id_players_id_fk" FOREIGN KEY ("player_2_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_1_id_teams_id_fk" FOREIGN KEY ("team_1_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_team_2_id_teams_id_fk" FOREIGN KEY ("team_2_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_knockout_maps" ADD CONSTRAINT "played_knockout_maps_knockout_lobby_id_knockout_lobbies_lobby_id_fk" FOREIGN KEY ("knockout_lobby_id") REFERENCES "knockout_lobbies"("lobby_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_knockout_maps" ADD CONSTRAINT "played_knockout_maps_pooled_map_id_pooled_maps_id_fk" FOREIGN KEY ("pooled_map_id") REFERENCES "pooled_maps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_maps" ADD CONSTRAINT "played_maps_pooled_map_id_pooled_maps_id_fk" FOREIGN KEY ("pooled_map_id") REFERENCES "pooled_maps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_maps" ADD CONSTRAINT "played_maps_match_id_matches_lobby_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("lobby_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_qualifier_maps" ADD CONSTRAINT "played_qualifier_maps_qualifier_lobby_id_qualifier_lobbies_lobby_id_fk" FOREIGN KEY ("qualifier_lobby_id") REFERENCES "qualifier_lobbies"("lobby_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "played_qualifier_maps" ADD CONSTRAINT "played_qualifier_maps_pooled_map_id_pooled_maps_id_fk" FOREIGN KEY ("pooled_map_id") REFERENCES "pooled_maps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "potential_matches" ADD CONSTRAINT "potential_matches_match_id_matches_lobby_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("lobby_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "potential_matches" ADD CONSTRAINT "potential_matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "potential_matches" ADD CONSTRAINT "potential_matches_player_1_id_players_id_fk" FOREIGN KEY ("player_1_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "potential_matches" ADD CONSTRAINT "potential_matches_player_2_id_players_id_fk" FOREIGN KEY ("player_2_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "potential_matches" ADD CONSTRAINT "potential_matches_team_1_id_teams_id_fk" FOREIGN KEY ("team_1_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "potential_matches" ADD CONSTRAINT "potential_matches_team_2_id_teams_id_fk" FOREIGN KEY ("team_2_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "qualifier_lobbies" ADD CONSTRAINT "qualifier_lobbies_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobbies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "mod_multipliers" ADD CONSTRAINT "mod_multipliers_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "player_scores" ADD CONSTRAINT "player_scores_on_pooled_map_id_pooled_maps_id_fk" FOREIGN KEY ("on_pooled_map_id") REFERENCES "pooled_maps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "player_scores" ADD CONSTRAINT "player_scores_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "player_scores" ADD CONSTRAINT "player_scores_team_score_id_team_scores_id_fk" FOREIGN KEY ("team_score_id") REFERENCES "team_scores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "player_scores" ADD CONSTRAINT "player_scores_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "team_scores" ADD CONSTRAINT "team_scores_on_pooled_map_id_pooled_maps_id_fk" FOREIGN KEY ("on_pooled_map_id") REFERENCES "pooled_maps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "team_scores" ADD CONSTRAINT "team_scores_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "team_scores" ADD CONSTRAINT "team_scores_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "match_predictions" ADD CONSTRAINT "match_predictions_match_id_matches_lobby_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("lobby_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "match_predictions" ADD CONSTRAINT "match_predictions_submission_id_prediction_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "prediction_submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pickem_users" ADD CONSTRAINT "pickem_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pickem_users" ADD CONSTRAINT "pickem_users_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pickem_users" ADD CONSTRAINT "pickem_users_prize_won_id_prizes_id_fk" FOREIGN KEY ("prize_won_id") REFERENCES "prizes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "potential_match_predictions" ADD CONSTRAINT "potential_match_predictions_potential_match_id_potential_matches_id_fk" FOREIGN KEY ("potential_match_id") REFERENCES "potential_matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "potential_match_predictions" ADD CONSTRAINT "potential_match_predictions_submission_id_prediction_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "prediction_submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "prediction_submissions" ADD CONSTRAINT "prediction_submissions_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "prediction_submissions" ADD CONSTRAINT "prediction_submissions_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "prediction_submissions" ADD CONSTRAINT "prediction_submissions_submitted_by_pickem_user_id_pickem_users_id_fk" FOREIGN KEY ("submitted_by_pickem_user_id") REFERENCES "pickem_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "qualifier_predictions" ADD CONSTRAINT "qualifier_predictions_submission_id_prediction_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "prediction_submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "qualifier_predictions" ADD CONSTRAINT "qualifier_predictions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "qualifier_predictions" ADD CONSTRAINT "qualifier_predictions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "granted_tournament_host_notifications" ADD CONSTRAINT "granted_tournament_host_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "granted_tournament_host_notifications" ADD CONSTRAINT "granted_tournament_host_notifications_previous_host_id_users_id_fk" FOREIGN KEY ("previous_host_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "granted_tournament_host_notifications" ADD CONSTRAINT "granted_tournament_host_notifications_new_host_id_users_id_fk" FOREIGN KEY ("new_host_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "issue_notifications" ADD CONSTRAINT "issue_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "issue_notifications" ADD CONSTRAINT "issue_notifications_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "join_team_request_notifications" ADD CONSTRAINT "join_team_request_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "join_team_request_notifications" ADD CONSTRAINT "join_team_request_notifications_request_id_join_team_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "join_team_requests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "new_staff_application_submission_notifications" ADD CONSTRAINT "new_staff_application_submission_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "new_staff_application_submission_notifications" ADD CONSTRAINT "new_staff_application_submission_notifications_staff_application_submission_id_staff_application_submissions_id_fk" FOREIGN KEY ("staff_application_submission_id") REFERENCES "staff_application_submissions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "round_publication_notifications" ADD CONSTRAINT "round_publication_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "round_publication_notifications" ADD CONSTRAINT "round_publication_notifications_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "staff_change_notifications" ADD CONSTRAINT "staff_change_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "staff_change_notifications" ADD CONSTRAINT "staff_change_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "team_change_notifications" ADD CONSTRAINT "team_change_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "team_change_notifications" ADD CONSTRAINT "team_change_notifications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "team_change_notifications" ADD CONSTRAINT "team_change_notifications_affected_user_id_users_id_fk" FOREIGN KEY ("affected_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "team_change_notifications" ADD CONSTRAINT "team_change_notifications_kicked_by_id_users_id_fk" FOREIGN KEY ("kicked_by_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tournament_deleted_notifications" ADD CONSTRAINT "tournament_deleted_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tournament_deleted_notifications" ADD CONSTRAINT "tournament_deleted_notifications_hosted_by_id_users_id_fk" FOREIGN KEY ("hosted_by_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "issues" ADD CONSTRAINT "issues_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "code_key" ON "countries" ("code");
CREATE UNIQUE INDEX IF NOT EXISTS "osu_user_id_key" ON "users" ("osu_user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "osu_username_key" ON "users" ("osu_username");
CREATE UNIQUE INDEX IF NOT EXISTS "discord_username_key" ON "users" ("discord_user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "discord_username_discord_discriminator_key" ON "users" ("discord_username","discord_discriminator");
CREATE UNIQUE INDEX IF NOT EXISTS "round_id_key" ON "battle_royale_rounds" ("round_id");
CREATE UNIQUE INDEX IF NOT EXISTS "round_id_key" ON "qualifier_rounds" ("round_id");
CREATE UNIQUE INDEX IF NOT EXISTS "name_tournament_id_key" ON "rounds" ("name","tournament_id");
CREATE UNIQUE INDEX IF NOT EXISTS "tournament_id_format_key" ON "stages" ("tournament_id","format");
CREATE UNIQUE INDEX IF NOT EXISTS "round_id_key" ON "standard_rounds" ("round_id");
CREATE UNIQUE INDEX IF NOT EXISTS "name_key" ON "tournaments" ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "user_id_tournament_id_key" ON "players" ("user_id","tournament_id");
CREATE UNIQUE INDEX IF NOT EXISTS "name_staff_application_id_key" ON "staff_application_roles" ("name","staff_application_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_id_tournament_id_key" ON "staff_members" ("user_id","tournament_id");
CREATE UNIQUE INDEX IF NOT EXISTS "name_tournament_id_key" ON "staff_roles" ("name","tournament_id");
CREATE UNIQUE INDEX IF NOT EXISTS "invite_id_key" ON "teams" ("invite_id");
CREATE UNIQUE INDEX IF NOT EXISTS "captain_id_key" ON "teams" ("captain_id");
CREATE UNIQUE INDEX IF NOT EXISTS "name_tournament_id_key" ON "teams" ("name","tournament_id");
CREATE UNIQUE INDEX IF NOT EXISTS "round_id_category_key" ON "modpools" ("round_id","category");
CREATE UNIQUE INDEX IF NOT EXISTS "modpool_id_beatmap_id_key" ON "pooled_maps" ("modpool_id","beatmap_id");
CREATE UNIQUE INDEX IF NOT EXISTS "beatmap_id_modpool_id_key" ON "suggested_maps" ("beatmap_id","modpool_id");
CREATE UNIQUE INDEX IF NOT EXISTS "local_id_tournament_id_key" ON "lobbies" ("local_id","tournament_id");
CREATE UNIQUE INDEX IF NOT EXISTS "tournament_id_mods_key" ON "mod_multipliers" ("tournament_id","mods");
CREATE UNIQUE INDEX IF NOT EXISTS "match_id_submission_id_key" ON "match_predictions" ("match_id","submission_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_id_tournament_id_key" ON "pickem_users" ("user_id","tournament_id");
CREATE UNIQUE INDEX IF NOT EXISTS "potential_match_id_submission_id_key" ON "potential_match_predictions" ("potential_match_id","submission_id");
CREATE UNIQUE INDEX IF NOT EXISTS "round_id_submitted_by_pickem_user_id_key" ON "prediction_submissions" ("round_id","submitted_by_pickem_user_id");