import type { Tournament } from '../../../src/lib/server/db';

export interface SeedTournament {
  data: typeof Tournament.$inferInsert;
  users: {
    osuUserId: number;
    discordUserId: string;
  }[];
}