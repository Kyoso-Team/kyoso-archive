<script lang="ts">
  import { form } from '$stores';
  import type { TournamentType } from '$types';

  function onCreateTournament() {
    form.create<{
      name: string;
      acronym: string;
      isOpenRank: boolean;
      lowerRankRange: number;
      upperRankRange: number;
      useBWS: boolean;
      type: TournamentType;
      teamSize: number;
      teamPlaySize: number;
    }>({
      title: 'Create Tournament',
      fields: ({ field }) => [
        field('Name', 'name', 'string', {
          validation: (z) => z.max(50)
        }),
        field('Acronym', 'acronym', 'string', {
          validation: (z) => z.max(8)
        }),
        field('Is it open rank?', 'isOpenRank', 'boolean'),
        field('Lower rank range limit', 'lowerRankRange', 'number', {
          validation: (z) => z.int().gte(1),
          disableIf: (tournament) => tournament.isOpenRank
        }),
        field('Upper rank range limit', 'upperRankRange', 'number', {
          validation: (z) => z.int().gte(1),
          disableIf: (tournament) => tournament.isOpenRank
        }),
        field('Type', 'type', 'string', {
          fromValues: {
            values: (): TournamentType[] => ['Teams', 'Solo']
          }
        }),
        field('Max. team size', 'teamSize', 'number', {
          validation: (z) => z.int().gte(1).lte(8),
          disableIf: (tournament) => tournament.type === 'Solo'
        }),
        field('Players allowed to play per beatmap', 'teamPlaySize', 'number', {
          validation: (z) => z.int().gte(1).lte(8),
          disableIf: (tournament) => tournament.type === 'Solo'
        }),
        field('Use BWS formula?', 'useBWS', 'boolean')
      ],
      onSubmit: (value) => {
        console.log(value);
      }
    });
  }
</script>

<button class="btn variant-filled-primary" on:click={onCreateTournament}>
  Create Tournament
</button>
