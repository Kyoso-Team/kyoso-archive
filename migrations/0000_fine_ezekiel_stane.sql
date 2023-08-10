DO $$ BEGIN
 CREATE TYPE "ban_oder" AS ENUM('ABABAB', 'ABBAAB');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "cash_metric" AS ENUM('fixed', 'percent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "issue_notification_type" AS ENUM('submission', 'resolved');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "issue_type" AS ENUM('security', 'enhancement', 'new_feature', 'bug', 'user_behavior');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "join_request_status" AS ENUM('pending', 'accepted', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "mappool_state" AS ENUM('private', 'playtesting', 'public');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "mod" AS ENUM('ez', 'hd', 'hr', 'sd', 'dt', 'rx', 'ht', 'fl', 'pf');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "opponent" AS ENUM('opponent1', 'opponent2');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "prize_type" AS ENUM('tournament', 'pickems');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "qualifier_runs_summary" AS ENUM('average', 'sum', 'best');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "round_publication_notification_type" AS ENUM('mappool', 'schedules', 'statistics');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "skillset" AS ENUM('consistency', 'streams', 'tech', 'alt', 'speed', 'gimmick', 'rhythm', 'aim', 'awkward_aim', 'flow_aim', 'reading', 'precision', 'stamina', 'finger_control', 'jack_of_all_trades');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "staff_change_notification_action" AS ENUM('added', 'removed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "staff_color" AS ENUM('slate', 'gray', 'red', 'orange', 'yellow', 'lime', 'green', 'emerald', 'cyan', 'blue', 'indigo', 'purple', 'fuchsia', 'pink');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "staff_permission" AS ENUM('host', 'debug', 'mutate_tournament', 'view_staff_members', 'mutate_staff_members', 'delete_staff_members', 'view_regs', 'mutate_regs', 'delete_regs', 'mutate_pool_structure', 'view_pool_suggestions', 'mutate_pool_suggestions', 'delete_pool_suggestions', 'view_pooled_maps', 'mutate_pooled_maps', 'delete_pooled_maps', 'can_playtest', 'view_matches', 'mutate_matches', 'delete_matches', 'ref_matches', 'commentate_matches', 'stream_matches', 'view_stats', 'mutate_stats', 'delete_stats', 'can_play');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "stage_format" AS ENUM('groups', 'swiss', 'qualifiers', 'single_elim', 'double_elim', 'battle_royale');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "team_change_notification_action" AS ENUM('joined', 'left', 'kicked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tournament_service" AS ENUM('registrations', 'mappooling', 'referee', 'stats', 'pickems');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tournament_type" AS ENUM('teams', 'draft', 'solo');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_theme" AS ENUM('light', 'dark');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "win_condition" AS ENUM('score', 'accuracy', 'combo', 'misses');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "country" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(35) NOT NULL,
	"code" char(2) NOT NULL,
	CONSTRAINT "country_code_key" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchased_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"cost" numeric(4, 2) NOT NULL,
	"paypal_order_id" varchar(20) NOT NULL,
	"services" tournament_service[5] DEFAULT array[]::tournament_service[]  NOT NULL,
	"purchased_by_id" integer NOT NULL,
	"for_tournament_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
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
	"theme" "user_theme" DEFAULT 'dark' NOT NULL,
	"show_discord_tag" boolean DEFAULT true,
	"country_id" integer NOT NULL,
	CONSTRAINT "user_osu_user_id_key" UNIQUE("osu_user_id"),
	CONSTRAINT "user_osu_username_key" UNIQUE("osu_username"),
	CONSTRAINT "user_discord_user_id_key" UNIQUE("discord_user_id"),
	CONSTRAINT "user_api_key_key" UNIQUE("api_key"),
	CONSTRAINT "user_discord_username_discord_discriminator_key" UNIQUE("discord_username","discord_discriminator")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "battle_royale_round" (
	"players_eliminated_per_map" smallint NOT NULL,
	"round_id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prize" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "prize_type" NOT NULL,
	"positons" smallint[] DEFAULT array[]::smallint[]  NOT NULL,
	"trophy" boolean NOT NULL,
	"medal" boolean NOT NULL,
	"badge" boolean NOT NULL,
	"banner" boolean NOT NULL,
	"additional_items" varchar(25)[] DEFAULT array[]::varchar[]  NOT NULL,
	"months_osu_supporter" smallint,
	"tournament_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prize_cash" (
	"value" real NOT NULL,
	"metric" "cash_metric" NOT NULL,
	"currency" char(3) NOT NULL,
	"in_prize_id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qualifier_round" (
	"publish_mp_links" boolean DEFAULT false NOT NULL,
	"run_count" smallint NOT NULL,
	"summarize_runs_as" "qualifier_runs_summary" DEFAULT 'average' NOT NULL,
	"round_id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "round" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(20) NOT NULL,
	"order" smallint NOT NULL,
	"target_star_rating" real,
	"mappool_state" "mappool_state" DEFAULT 'private' NOT NULL,
	"publish_schedules" boolean DEFAULT false NOT NULL,
	"publish_stats" boolean DEFAULT false NOT NULL,
	"stage_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	CONSTRAINT "round_name_tournament_id_key" UNIQUE("name","tournament_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stage" (
	"id" serial PRIMARY KEY NOT NULL,
	"format" "stage_format" NOT NULL,
	"order" smallint NOT NULL,
	"is_main_stage" boolean DEFAULT false NOT NULL,
	"tournament_id" integer NOT NULL,
	CONSTRAINT "stage_tournament_id_format_key" UNIQUE("tournament_id","format")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "standard_round" (
	"best_of" smallint NOT NULL,
	"ban_count" smallint NOT NULL,
	"round_id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tournament" (
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
	"has_logo" boolean DEFAULT false,
	"use_team_banners" boolean DEFAULT true,
	"use_bws" boolean NOT NULL,
	"rules" text,
	"type" "tournament_type" NOT NULL,
	"services" tournament_service[5] DEFAULT array[]::tournament_service[] NOT NULL,
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
	"ban_order" "ban_oder" DEFAULT 'ABABAB' NOT NULL,
	"win_condition" "win_condition" DEFAULT 'score' NOT NULL,
	CONSTRAINT "tournament_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "join_team_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"requested_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"status" "join_request_status" DEFAULT 'pending' NOT NULL,
	"sent_by_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player" (
	"id" serial PRIMARY KEY NOT NULL,
	"registered_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"availability" char(99) NOT NULL,
	"tournament_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer,
	CONSTRAINT "player_user_id_tournament_id_key" UNIQUE("user_id","tournament_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_application_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(25) NOT NULL,
	"description" text,
	"staff_application_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_application_submission" (
	"id" serial PRIMARY KEY NOT NULL,
	"applying_for" varchar(25)[] DEFAULT array[]::varchar[]  NOT NULL,
	"status" "join_request_status" DEFAULT 'pending' NOT NULL,
	"staffing_experience" text NOT NULL,
	"additional_comments" text,
	"staff_application_id" integer NOT NULL,
	"submitted_by_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_application" (
	"title" varchar(75) NOT NULL,
	"description" text,
	"tournament_id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_member" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	CONSTRAINT "staff_member_user_id_tournament_id_key" UNIQUE("user_id","tournament_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(25) NOT NULL,
	"color" "staff_color" DEFAULT 'slate' NOT NULL,
	"permissions" staff_permission[27] DEFAULT array[]::staff_permission[]  NOT NULL,
	"tournament_id" integer NOT NULL,
	CONSTRAINT "staff_role_name_tournament_id_key" UNIQUE("name","tournament_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team" (
	"id" serial PRIMARY KEY NOT NULL,
	"registered_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"name" varchar(20) NOT NULL,
	"invite_id" char(8) NOT NULL,
	"has_banner" boolean DEFAULT false NOT NULL,
	"tournament_id" integer NOT NULL,
	"captain_id" integer NOT NULL,
	CONSTRAINT "team_invite_id_key" UNIQUE("invite_id"),
	CONSTRAINT "team_captain_id_key" UNIQUE("captain_id"),
	CONSTRAINT "team_name_tournament_id_key" UNIQUE("name","tournament_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knockout_lobby_to_player" (
	"knockout_lobby_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	CONSTRAINT knockout_lobby_to_player_knockout_lobby_id_player_id PRIMARY KEY("knockout_lobby_id","player_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knockout_lobby_to_team" (
	"knockout_lobby_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	CONSTRAINT knockout_lobby_to_team_knockout_lobby_id_team_id PRIMARY KEY("knockout_lobby_id","team_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lobby_to_staff_member_as_commentator" (
	"lobby_id" integer NOT NULL,
	"staff_member_id" integer NOT NULL,
	CONSTRAINT lobby_to_staff_member_as_commentator_staff_member_id_lobby_id PRIMARY KEY("staff_member_id","lobby_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lobby_to_staff_member_as_referee" (
	"lobby_id" integer NOT NULL,
	"staff_member_id" integer NOT NULL,
	CONSTRAINT lobby_to_staff_member_as_referee_staff_member_id_lobby_id PRIMARY KEY("staff_member_id","lobby_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lobby_to_staff_member_as_streamer" (
	"lobby_id" integer NOT NULL,
	"staff_member_id" integer NOT NULL,
	CONSTRAINT lobby_to_staff_member_as_streamer_staff_member_id_lobby_id PRIMARY KEY("staff_member_id","lobby_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "played_knockout_map_to_player_as_knocked_out" (
	"played_knockout_map_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	CONSTRAINT played_knockout_map_to_player_as_knocked_out_played_knockout_map_id_player_id PRIMARY KEY("played_knockout_map_id","player_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "played_knockout_map_to_player_as_played" (
	"played_knockout_map_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	CONSTRAINT played_knockout_map_to_player_as_played_played_knockout_map_id_player_id PRIMARY KEY("played_knockout_map_id","player_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "played_knockout_map_to_team_as_knocked_out" (
	"played_knockout_map_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	CONSTRAINT played_knockout_map_to_team_as_knocked_out_played_knockout_map_id_team_id PRIMARY KEY("played_knockout_map_id","team_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "played_knockout_map_to_team_as_played" (
	"played_knockout_map_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	CONSTRAINT played_knockout_map_to_team_as_played_played_knockout_map_id_team_id PRIMARY KEY("played_knockout_map_id","team_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "played_qualifier_map_to_player" (
	"played_qualifier_map_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	CONSTRAINT played_qualifier_map_to_player_played_qualifier_map_id_player_id PRIMARY KEY("played_qualifier_map_id","player_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "played_qualifier_map_to_team" (
	"played_qualifier_map_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	CONSTRAINT played_qualifier_map_to_team_played_qualifier_map_id_team_id PRIMARY KEY("played_qualifier_map_id","team_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qualifier_lobby_to_player" (
	"qualifier_lobby_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	CONSTRAINT qualifier_lobby_to_player_qualifier_lobby_id_player_id PRIMARY KEY("qualifier_lobby_id","player_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qualifier_lobby_to_team" (
	"qualifier_lobby_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	CONSTRAINT qualifier_lobby_to_team_qualifier_lobby_id_team_id PRIMARY KEY("qualifier_lobby_id","team_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_member_to_staff_role" (
	"staff_member_id" integer NOT NULL,
	"staff_role_id" integer NOT NULL,
	CONSTRAINT staff_member_to_staff_role_staff_member_id_staff_role_id PRIMARY KEY("staff_member_id","staff_role_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "beatmap" (
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "beatmapset" (
	"osu_beatmapset_id" integer PRIMARY KEY NOT NULL,
	"artist" varchar(70) NOT NULL,
	"title" varchar(180) NOT NULL,
	"mapper_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mapper" (
	"osu_user_id" integer PRIMARY KEY NOT NULL,
	"username" varchar(16) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "modpool" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(3) NOT NULL,
	"mods" mod[4] DEFAULT array[]::mod[] NOT NULL,
	"is_free_mod" boolean NOT NULL,
	"order" smallint NOT NULL,
	"map_count" smallint,
	"round_id" integer NOT NULL,
	CONSTRAINT "modpool_round_id_category_key" UNIQUE("round_id","category")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pooled_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot" smallint NOT NULL,
	"skillsets" skillset[3] DEFAULT array[]::skillset[]  NOT NULL,
	"pooler_comment" text,
	"has_beatmap_file" boolean DEFAULT false NOT NULL,
	"has_replay" boolean DEFAULT false NOT NULL,
	"tournament_id" integer NOT NULL,
	"round_id" integer NOT NULL,
	"modpool_id" integer NOT NULL,
	"beatmap_id" integer NOT NULL,
	"suggested_by_staff_member_id" integer,
	"pooled_by_staff_member_id" integer,
	CONSTRAINT "pooled_map_modpool_id_beatmap_id_key" UNIQUE("modpool_id","beatmap_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pooled_map_rating" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating" numeric(3, 1) NOT NULL,
	"pooled_map_id" integer NOT NULL,
	"rated_by_id" integer,
	CONSTRAINT "pooled_map_rating_rated_by_id_pooled_by_id_key" UNIQUE("rated_by_id","pooled_map_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "star_rating" (
	"id" serial PRIMARY KEY NOT NULL,
	"mods" mod[4] DEFAULT array[]::mod[]  NOT NULL,
	"value" real NOT NULL,
	"beatmap_id" integer NOT NULL,
	CONSTRAINT "star_rating_mods_beatmap_id_key" UNIQUE("mods","beatmap_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suggested_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"suggested_skillset" skillset[3] DEFAULT array[]::skillset[]  NOT NULL,
	"suggester_comment" text,
	"tournament_id" integer NOT NULL,
	"round_id" integer NOT NULL,
	"modpool_id" integer NOT NULL,
	"beatmap_id" integer NOT NULL,
	"suggested_by_staff_member_id" integer,
	CONSTRAINT "suggested_map_beatmap_id_modpool_id_key" UNIQUE("beatmap_id","modpool_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "banned_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"banned_by" "opponent" NOT NULL,
	"pooled_map_id" integer,
	"match_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knockout_lobby" (
	"lobby_id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lobby" (
	"id" serial PRIMARY KEY NOT NULL,
	"local_id" varchar(5),
	"date" timestamp (3) with time zone,
	"referee_notes" text,
	"osu_mp_ids" integer[] DEFAULT array[]::integer[]  NOT NULL,
	"tournament_id" integer NOT NULL,
	"round_id" integer NOT NULL,
	CONSTRAINT "lobby_local_id_tournament_id_key" UNIQUE("local_id","tournament_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match" (
	"roll_winner" "opponent",
	"ban_first" "opponent",
	"pick_first" "opponent",
	"forfeit_from" "opponent",
	"winner" "opponent",
	"lobby_id" integer PRIMARY KEY NOT NULL,
	"player_1_id" integer,
	"player_2_id" integer,
	"team_1_id" integer,
	"team_2_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "played_knockout_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"knockout_lobby_id" integer NOT NULL,
	"pooled_map_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "played_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"winner" "opponent" NOT NULL,
	"picked_by" "opponent" NOT NULL,
	"pooled_map_id" integer,
	"match_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "played_qualifier_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"qualifier_lobby_id" integer NOT NULL,
	"pooled_map_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "potential_match" (
	"id" serial PRIMARY KEY NOT NULL,
	"local_id" varchar(5),
	"date" timestamp (3) with time zone,
	"match_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	"player_1_id" integer,
	"player_2_id" integer,
	"team_1_id" integer,
	"team_2_id" integer,
	CONSTRAINT "potential_match_local_id_tournament_id_key" UNIQUE("local_id","tournament_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qualifier_lobby" (
	"lobby_id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mod_multiplier" (
	"id" serial PRIMARY KEY NOT NULL,
	"mods" mod[4] DEFAULT array[]::mod[] NOT NULL,
	"value" real NOT NULL,
	"tournament_id" integer NOT NULL,
	CONSTRAINT "mod_multiplier_tournament_id_mods_key" UNIQUE("tournament_id","mods")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_score" (
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
	"mods" mod[4] DEFAULT array[]::mod[]  NOT NULL,
	"on_pooled_map_id" integer NOT NULL,
	"round_id" integer NOT NULL,
	"team_score_id" integer NOT NULL,
	"player_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_score" (
	"id" serial PRIMARY KEY NOT NULL,
	"on_pooled_map_id" integer NOT NULL,
	"round_id" integer NOT NULL,
	"team_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_prediction" (
	"id" serial PRIMARY KEY NOT NULL,
	"predicted_winner" "opponent" NOT NULL,
	"match_id" integer NOT NULL,
	"submission_id" integer NOT NULL,
	CONSTRAINT "match_prediction_match_id_submission_id_key" UNIQUE("match_id","submission_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pickem_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"points" smallint DEFAULT 0 NOT NULL,
	"user_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	CONSTRAINT "pickem_user_user_id_tournament_id_key" UNIQUE("user_id","tournament_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "potential_match_prediction" (
	"id" serial PRIMARY KEY NOT NULL,
	"predicted_winner" "opponent" NOT NULL,
	"potential_match_id" integer NOT NULL,
	"submission_id" integer NOT NULL,
	CONSTRAINT "potential_match_prediction_potential_match_id_submission_id_key" UNIQUE("potential_match_id","submission_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prediction_submission" (
	"id" serial PRIMARY KEY NOT NULL,
	"submitted_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"tournament_id" integer NOT NULL,
	"round_id" integer NOT NULL,
	"submitted_by_pickem_user_id" integer NOT NULL,
	CONSTRAINT "prediction_submission_round_id_submitted_by_pickem_user_id_key" UNIQUE("round_id","submitted_by_pickem_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qualifier_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"predicted_position" smallint NOT NULL,
	"submission_id" integer NOT NULL,
	"player_id" integer,
	"team_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "granted_tournament_host_notification" (
	"notification_id" bigint PRIMARY KEY NOT NULL,
	"tournament_id" integer,
	"previous_host_id" integer,
	"new_host_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "issue_notification" (
	"notification_type" "issue_notification_type" NOT NULL,
	"notification_id" bigint PRIMARY KEY NOT NULL,
	"issue_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "join_team_request_notification" (
	"notification_id" bigint PRIMARY KEY NOT NULL,
	"request_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "new_staff_application_submission_notification" (
	"notification_id" bigint PRIMARY KEY NOT NULL,
	"staff_application_submission_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"notified_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "round_publication_notification" (
	"publicized" "round_publication_notification_type" NOT NULL,
	"notification_id" bigint PRIMARY KEY NOT NULL,
	"round_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_change_notification" (
	"action" "staff_change_notification_action" NOT NULL,
	"added_with_roles" varchar(25)[] DEFAULT array[]::varchar[]  NOT NULL,
	"notification_id" bigint PRIMARY KEY NOT NULL,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_change_notification" (
	"action" "team_change_notification_action" NOT NULL,
	"notification_id" bigint PRIMARY KEY NOT NULL,
	"team_id" integer,
	"affected_user_id" integer,
	"kicked_by_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tournament_deleted_notification" (
	"tournament_name" varchar(50) NOT NULL,
	"notification_id" bigint PRIMARY KEY NOT NULL,
	"hosted_by_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "issue" (
	"id" serial PRIMARY KEY NOT NULL,
	"submitted_on" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"title" varchar(35) NOT NULL,
	"body" text NOT NULL,
	"type" "issue_type" NOT NULL,
	"image_count" smallint DEFAULT 0 NOT NULL,
	"can_contact" boolean DEFAULT false NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"submitted_by_id" integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "staff_application_role_name_staff_application_id_key" ON "staff_application_role" ("name","staff_application_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase" ADD CONSTRAINT "purchase_purchased_by_id_user_id_fk" FOREIGN KEY ("purchased_by_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase" ADD CONSTRAINT "purchase_for_tournament_id_tournament_id_fk" FOREIGN KEY ("for_tournament_id") REFERENCES "tournament"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_country_id_country_id_fk" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "battle_royale_round" ADD CONSTRAINT "battle_royale_round_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prize" ADD CONSTRAINT "prize_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prize_cash" ADD CONSTRAINT "prize_cash_in_prize_id_prize_id_fk" FOREIGN KEY ("in_prize_id") REFERENCES "prize"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualifier_round" ADD CONSTRAINT "qualifier_round_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "round" ADD CONSTRAINT "round_stage_id_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "stage"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "round" ADD CONSTRAINT "round_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stage" ADD CONSTRAINT "stage_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "standard_round" ADD CONSTRAINT "standard_round_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "join_team_request" ADD CONSTRAINT "join_team_request_sent_by_id_player_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "player"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player" ADD CONSTRAINT "player_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player" ADD CONSTRAINT "player_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player" ADD CONSTRAINT "player_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_application_role" ADD CONSTRAINT "staff_application_role_staff_application_id_staff_application_tournament_id_fk" FOREIGN KEY ("staff_application_id") REFERENCES "staff_application"("tournament_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_application_submission" ADD CONSTRAINT "staff_application_submission_staff_application_id_staff_application_tournament_id_fk" FOREIGN KEY ("staff_application_id") REFERENCES "staff_application"("tournament_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_application_submission" ADD CONSTRAINT "staff_application_submission_submitted_by_id_user_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_application" ADD CONSTRAINT "staff_application_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_member" ADD CONSTRAINT "staff_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_member" ADD CONSTRAINT "staff_member_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_role" ADD CONSTRAINT "staff_role_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team" ADD CONSTRAINT "team_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team" ADD CONSTRAINT "team_captain_id_player_id_fk" FOREIGN KEY ("captain_id") REFERENCES "player"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knockout_lobby_to_player" ADD CONSTRAINT "knockout_lobby_to_player_knockout_lobby_id_knockout_lobby_lobby_id_fk" FOREIGN KEY ("knockout_lobby_id") REFERENCES "knockout_lobby"("lobby_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knockout_lobby_to_player" ADD CONSTRAINT "knockout_lobby_to_player_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knockout_lobby_to_team" ADD CONSTRAINT "knockout_lobby_to_team_knockout_lobby_id_knockout_lobby_lobby_id_fk" FOREIGN KEY ("knockout_lobby_id") REFERENCES "knockout_lobby"("lobby_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knockout_lobby_to_team" ADD CONSTRAINT "knockout_lobby_to_team_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lobby_to_staff_member_as_commentator" ADD CONSTRAINT "lobby_to_staff_member_as_commentator_lobby_id_lobby_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobby"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lobby_to_staff_member_as_commentator" ADD CONSTRAINT "lobby_to_staff_member_as_commentator_staff_member_id_staff_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "staff_member"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lobby_to_staff_member_as_referee" ADD CONSTRAINT "lobby_to_staff_member_as_referee_lobby_id_lobby_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobby"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lobby_to_staff_member_as_referee" ADD CONSTRAINT "lobby_to_staff_member_as_referee_staff_member_id_staff_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "staff_member"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lobby_to_staff_member_as_streamer" ADD CONSTRAINT "lobby_to_staff_member_as_streamer_lobby_id_lobby_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobby"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lobby_to_staff_member_as_streamer" ADD CONSTRAINT "lobby_to_staff_member_as_streamer_staff_member_id_staff_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "staff_member"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_player_as_knocked_out" ADD CONSTRAINT "played_knockout_map_to_player_as_knocked_out_played_knockout_map_id_played_knockout_map_id_fk" FOREIGN KEY ("played_knockout_map_id") REFERENCES "played_knockout_map"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_player_as_knocked_out" ADD CONSTRAINT "played_knockout_map_to_player_as_knocked_out_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_player_as_played" ADD CONSTRAINT "played_knockout_map_to_player_as_played_played_knockout_map_id_played_knockout_map_id_fk" FOREIGN KEY ("played_knockout_map_id") REFERENCES "played_knockout_map"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_player_as_played" ADD CONSTRAINT "played_knockout_map_to_player_as_played_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_team_as_knocked_out" ADD CONSTRAINT "played_knockout_map_to_team_as_knocked_out_played_knockout_map_id_played_knockout_map_id_fk" FOREIGN KEY ("played_knockout_map_id") REFERENCES "played_knockout_map"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_team_as_knocked_out" ADD CONSTRAINT "played_knockout_map_to_team_as_knocked_out_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_team_as_played" ADD CONSTRAINT "played_knockout_map_to_team_as_played_played_knockout_map_id_played_knockout_map_id_fk" FOREIGN KEY ("played_knockout_map_id") REFERENCES "played_knockout_map"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_knockout_map_to_team_as_played" ADD CONSTRAINT "played_knockout_map_to_team_as_played_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_qualifier_map_to_player" ADD CONSTRAINT "played_qualifier_map_to_player_played_qualifier_map_id_played_qualifier_map_id_fk" FOREIGN KEY ("played_qualifier_map_id") REFERENCES "played_qualifier_map"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_qualifier_map_to_player" ADD CONSTRAINT "played_qualifier_map_to_player_player_id_team_id_fk" FOREIGN KEY ("player_id") REFERENCES "team"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_qualifier_map_to_team" ADD CONSTRAINT "played_qualifier_map_to_team_played_qualifier_map_id_played_qualifier_map_id_fk" FOREIGN KEY ("played_qualifier_map_id") REFERENCES "played_qualifier_map"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_qualifier_map_to_team" ADD CONSTRAINT "played_qualifier_map_to_team_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualifier_lobby_to_player" ADD CONSTRAINT "qualifier_lobby_to_player_qualifier_lobby_id_qualifier_lobby_lobby_id_fk" FOREIGN KEY ("qualifier_lobby_id") REFERENCES "qualifier_lobby"("lobby_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualifier_lobby_to_player" ADD CONSTRAINT "qualifier_lobby_to_player_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualifier_lobby_to_team" ADD CONSTRAINT "qualifier_lobby_to_team_qualifier_lobby_id_qualifier_lobby_lobby_id_fk" FOREIGN KEY ("qualifier_lobby_id") REFERENCES "qualifier_lobby"("lobby_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualifier_lobby_to_team" ADD CONSTRAINT "qualifier_lobby_to_team_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_member_to_staff_role" ADD CONSTRAINT "staff_member_to_staff_role_staff_member_id_staff_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "staff_member"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_member_to_staff_role" ADD CONSTRAINT "staff_member_to_staff_role_staff_role_id_staff_role_id_fk" FOREIGN KEY ("staff_role_id") REFERENCES "staff_role"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "beatmap" ADD CONSTRAINT "beatmap_beatmapset_id_beatmapset_osu_beatmapset_id_fk" FOREIGN KEY ("beatmapset_id") REFERENCES "beatmapset"("osu_beatmapset_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "beatmapset" ADD CONSTRAINT "beatmapset_mapper_id_mapper_osu_user_id_fk" FOREIGN KEY ("mapper_id") REFERENCES "mapper"("osu_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "modpool" ADD CONSTRAINT "modpool_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pooled_map" ADD CONSTRAINT "pooled_map_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pooled_map" ADD CONSTRAINT "pooled_map_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pooled_map" ADD CONSTRAINT "pooled_map_modpool_id_modpool_id_fk" FOREIGN KEY ("modpool_id") REFERENCES "modpool"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pooled_map" ADD CONSTRAINT "pooled_map_beatmap_id_beatmap_osu_beatmap_id_fk" FOREIGN KEY ("beatmap_id") REFERENCES "beatmap"("osu_beatmap_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pooled_map" ADD CONSTRAINT "pooled_map_suggested_by_staff_member_id_staff_member_id_fk" FOREIGN KEY ("suggested_by_staff_member_id") REFERENCES "staff_member"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pooled_map" ADD CONSTRAINT "pooled_map_pooled_by_staff_member_id_staff_member_id_fk" FOREIGN KEY ("pooled_by_staff_member_id") REFERENCES "staff_member"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pooled_map_rating" ADD CONSTRAINT "pooled_map_rating_pooled_map_id_pooled_map_id_fk" FOREIGN KEY ("pooled_map_id") REFERENCES "pooled_map"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pooled_map_rating" ADD CONSTRAINT "pooled_map_rating_rated_by_id_staff_member_id_fk" FOREIGN KEY ("rated_by_id") REFERENCES "staff_member"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "star_rating" ADD CONSTRAINT "star_rating_beatmap_id_beatmap_osu_beatmap_id_fk" FOREIGN KEY ("beatmap_id") REFERENCES "beatmap"("osu_beatmap_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suggested_map" ADD CONSTRAINT "suggested_map_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suggested_map" ADD CONSTRAINT "suggested_map_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suggested_map" ADD CONSTRAINT "suggested_map_modpool_id_modpool_id_fk" FOREIGN KEY ("modpool_id") REFERENCES "modpool"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suggested_map" ADD CONSTRAINT "suggested_map_beatmap_id_beatmap_osu_beatmap_id_fk" FOREIGN KEY ("beatmap_id") REFERENCES "beatmap"("osu_beatmap_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suggested_map" ADD CONSTRAINT "suggested_map_suggested_by_staff_member_id_staff_member_id_fk" FOREIGN KEY ("suggested_by_staff_member_id") REFERENCES "staff_member"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "banned_map" ADD CONSTRAINT "banned_map_pooled_map_id_pooled_map_id_fk" FOREIGN KEY ("pooled_map_id") REFERENCES "pooled_map"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "banned_map" ADD CONSTRAINT "banned_map_match_id_match_lobby_id_fk" FOREIGN KEY ("match_id") REFERENCES "match"("lobby_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knockout_lobby" ADD CONSTRAINT "knockout_lobby_lobby_id_lobby_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobby"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lobby" ADD CONSTRAINT "lobby_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lobby" ADD CONSTRAINT "lobby_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match" ADD CONSTRAINT "match_lobby_id_lobby_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobby"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match" ADD CONSTRAINT "match_player_1_id_player_id_fk" FOREIGN KEY ("player_1_id") REFERENCES "player"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match" ADD CONSTRAINT "match_player_2_id_player_id_fk" FOREIGN KEY ("player_2_id") REFERENCES "player"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match" ADD CONSTRAINT "match_team_1_id_team_id_fk" FOREIGN KEY ("team_1_id") REFERENCES "team"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match" ADD CONSTRAINT "match_team_2_id_team_id_fk" FOREIGN KEY ("team_2_id") REFERENCES "team"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_knockout_map" ADD CONSTRAINT "played_knockout_map_knockout_lobby_id_knockout_lobby_lobby_id_fk" FOREIGN KEY ("knockout_lobby_id") REFERENCES "knockout_lobby"("lobby_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_knockout_map" ADD CONSTRAINT "played_knockout_map_pooled_map_id_pooled_map_id_fk" FOREIGN KEY ("pooled_map_id") REFERENCES "pooled_map"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_map" ADD CONSTRAINT "played_map_pooled_map_id_pooled_map_id_fk" FOREIGN KEY ("pooled_map_id") REFERENCES "pooled_map"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_map" ADD CONSTRAINT "played_map_match_id_match_lobby_id_fk" FOREIGN KEY ("match_id") REFERENCES "match"("lobby_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_qualifier_map" ADD CONSTRAINT "played_qualifier_map_qualifier_lobby_id_qualifier_lobby_lobby_id_fk" FOREIGN KEY ("qualifier_lobby_id") REFERENCES "qualifier_lobby"("lobby_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "played_qualifier_map" ADD CONSTRAINT "played_qualifier_map_pooled_map_id_pooled_map_id_fk" FOREIGN KEY ("pooled_map_id") REFERENCES "pooled_map"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "potential_match" ADD CONSTRAINT "potential_match_match_id_match_lobby_id_fk" FOREIGN KEY ("match_id") REFERENCES "match"("lobby_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "potential_match" ADD CONSTRAINT "potential_match_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "potential_match" ADD CONSTRAINT "potential_match_player_1_id_player_id_fk" FOREIGN KEY ("player_1_id") REFERENCES "player"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "potential_match" ADD CONSTRAINT "potential_match_player_2_id_player_id_fk" FOREIGN KEY ("player_2_id") REFERENCES "player"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "potential_match" ADD CONSTRAINT "potential_match_team_1_id_team_id_fk" FOREIGN KEY ("team_1_id") REFERENCES "team"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "potential_match" ADD CONSTRAINT "potential_match_team_2_id_team_id_fk" FOREIGN KEY ("team_2_id") REFERENCES "team"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualifier_lobby" ADD CONSTRAINT "qualifier_lobby_lobby_id_lobby_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobby"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mod_multiplier" ADD CONSTRAINT "mod_multiplier_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_score" ADD CONSTRAINT "player_score_on_pooled_map_id_pooled_map_id_fk" FOREIGN KEY ("on_pooled_map_id") REFERENCES "pooled_map"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_score" ADD CONSTRAINT "player_score_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_score" ADD CONSTRAINT "player_score_team_score_id_team_score_id_fk" FOREIGN KEY ("team_score_id") REFERENCES "team_score"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_score" ADD CONSTRAINT "player_score_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_score" ADD CONSTRAINT "team_score_on_pooled_map_id_pooled_map_id_fk" FOREIGN KEY ("on_pooled_map_id") REFERENCES "pooled_map"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_score" ADD CONSTRAINT "team_score_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_score" ADD CONSTRAINT "team_score_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_prediction" ADD CONSTRAINT "match_prediction_match_id_match_lobby_id_fk" FOREIGN KEY ("match_id") REFERENCES "match"("lobby_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_prediction" ADD CONSTRAINT "match_prediction_submission_id_prediction_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "prediction_submission"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pickem_user" ADD CONSTRAINT "pickem_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pickem_user" ADD CONSTRAINT "pickem_user_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "potential_match_prediction" ADD CONSTRAINT "potential_match_prediction_potential_match_id_potential_match_id_fk" FOREIGN KEY ("potential_match_id") REFERENCES "potential_match"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "potential_match_prediction" ADD CONSTRAINT "potential_match_prediction_submission_id_prediction_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "prediction_submission"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prediction_submission" ADD CONSTRAINT "prediction_submission_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prediction_submission" ADD CONSTRAINT "prediction_submission_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prediction_submission" ADD CONSTRAINT "prediction_submission_submitted_by_pickem_user_id_pickem_user_id_fk" FOREIGN KEY ("submitted_by_pickem_user_id") REFERENCES "pickem_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualifier_predictions" ADD CONSTRAINT "qualifier_predictions_submission_id_prediction_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "prediction_submission"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualifier_predictions" ADD CONSTRAINT "qualifier_predictions_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qualifier_predictions" ADD CONSTRAINT "qualifier_predictions_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "granted_tournament_host_notification" ADD CONSTRAINT "granted_tournament_host_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "granted_tournament_host_notification" ADD CONSTRAINT "granted_tournament_host_notification_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "granted_tournament_host_notification" ADD CONSTRAINT "granted_tournament_host_notification_previous_host_id_user_id_fk" FOREIGN KEY ("previous_host_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "granted_tournament_host_notification" ADD CONSTRAINT "granted_tournament_host_notification_new_host_id_user_id_fk" FOREIGN KEY ("new_host_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "issue_notification" ADD CONSTRAINT "issue_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "issue_notification" ADD CONSTRAINT "issue_notification_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "issue"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "join_team_request_notification" ADD CONSTRAINT "join_team_request_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "join_team_request_notification" ADD CONSTRAINT "join_team_request_notification_request_id_join_team_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "join_team_request"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "new_staff_application_submission_notification" ADD CONSTRAINT "new_staff_application_submission_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "new_staff_application_submission_notification" ADD CONSTRAINT "new_staff_application_submission_notification_staff_application_submission_id_staff_application_submission_id_fk" FOREIGN KEY ("staff_application_submission_id") REFERENCES "staff_application_submission"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "round_publication_notification" ADD CONSTRAINT "round_publication_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "round_publication_notification" ADD CONSTRAINT "round_publication_notification_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "round"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_change_notification" ADD CONSTRAINT "staff_change_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_change_notification" ADD CONSTRAINT "staff_change_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_change_notification" ADD CONSTRAINT "team_change_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_change_notification" ADD CONSTRAINT "team_change_notification_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_change_notification" ADD CONSTRAINT "team_change_notification_affected_user_id_user_id_fk" FOREIGN KEY ("affected_user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_change_notification" ADD CONSTRAINT "team_change_notification_kicked_by_id_user_id_fk" FOREIGN KEY ("kicked_by_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tournament_deleted_notification" ADD CONSTRAINT "tournament_deleted_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tournament_deleted_notification" ADD CONSTRAINT "tournament_deleted_notification_hosted_by_id_user_id_fk" FOREIGN KEY ("hosted_by_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "issue" ADD CONSTRAINT "issue_submitted_by_id_user_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
