import type { TournamentService } from '@prisma/client';

export const services: Record<
  TournamentService | string,
  {
    soloPrice: number;
    teamsPrice: number;
  }
> = {
  Registrations: {
    soloPrice: 3,
    teamsPrice: 3.5
  },
  Mappooling: {
    soloPrice: 2.5,
    teamsPrice: 2.5
  },
  Referee: {
    soloPrice: 3,
    teamsPrice: 3
  },
  Stats: {
    soloPrice: 1.5,
    teamsPrice: 2
  },
  Pickems: {
    soloPrice: 2,
    teamsPrice: 2
  }
};
