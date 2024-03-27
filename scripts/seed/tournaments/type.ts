import type { Tournament, TournamentDates } from '../../../src/lib/server/db';

export interface SeedTournament {
  data: typeof Tournament.$inferInsert;
  dates: Omit<typeof TournamentDates.$inferInsert, 'tournamentId'>;
  users: {
    osuUserId: number;
    discordUserId: string;
  }[];
}
