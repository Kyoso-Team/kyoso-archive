import type { TournamentService } from '$types';

export const services: Record<
  TournamentService | string,
  {
    soloPrice: number;
    teamsPrice: number;
  }
> = {
  registrations: {
    soloPrice: 3,
    teamsPrice: 3.5
  },
  mappooling: {
    soloPrice: 2.5,
    teamsPrice: 2.5
  },
  referee: {
    soloPrice: 3,
    teamsPrice: 3
  },
  stats: {
    soloPrice: 1.5,
    teamsPrice: 2
  },
  pickems: {
    soloPrice: 2,
    teamsPrice: 2
  }
};

export const firsBlogPostTimestmap = 1_687_721_464_000;
