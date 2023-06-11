<script lang="ts">
  import { Table, tableMapperValues } from '@skeletonlabs/skeleton';
  import type { TableSource } from '@skeletonlabs/skeleton';
  import type { TournamentType, Prize as PrismaPrize, CashPrize } from '@prisma/client';

  type Prize = Omit<PrismaPrize, 'id' | 'tournamentId'> & {
      cash: Omit<CashPrize, 'inPrizeId'> | null;
      awardedToPlayers: {
        user: {
          id: number;
          osuUsername: string;
        };
      }[];
      awardedToTeams: {
        id: number;
        name: string;
      }[];
  };

  const baseHead = ['Placement', 'Trophy', 'Medal', 'Badge', 'Banner', 'Items', 'osu! Supporter', 'Cash'];
  export let prizes: Prize[];
  export let tournamentType: TournamentType;
  let has = {
    trophy: false,
    medal: false,
    badge: false,
    banner: false,
    items: false,
    osuSupporter: false
  };
  let tblSrc: TableSource = {
    head: [],
    body: tableMapperValues(prizes, [])
  };

  function prizesHaveKey(prizes: Prize[], key: keyof typeof has) {
    return !!prizes.find((prize) => {
      let value = prize[key];
      
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      if (typeof value === 'number') {
        return value > 0;
      }

      return !!value;
    });
  }

  $: {
    has = {
      trophy: prizesHaveKey(prizes, 'trophy'),
      badge: prizesHaveKey(prizes, 'badge'),
      banner: prizesHaveKey(prizes, 'banner'),
      items: prizesHaveKey(prizes, 'items'),
      medal: prizesHaveKey(prizes, 'medal'),
      osuSupporter: prizesHaveKey(prizes, 'osuSupporter')
    };
  }
</script>