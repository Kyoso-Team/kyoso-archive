<script lang="ts">
  import { Paginator, Table } from '@skeletonlabs/skeleton';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let purchases = data.purchases;

  let page = {
    offset: 0,
    limit: Math.min(10, purchases.length),
    size: purchases.length,
    amounts: [Math.min(3, purchases.length), 10, 20, 40]
  };

  let sourceHeaders = [
    'ID',
    'PayPal ID',
    'Cost',
    'Services',
    'Purchaser (ID)',
    'Tournament (ID)',
    'Date'
  ];
  let sourceBody = purchases.map((purch) => {
    return [
      purch.id,
      purch.paypalOrderId,
      purch.cost,
      String(purch.services).replace(/,/g, ', '),
      `${purch.purchasedBy.osuUsername} (${purch.purchasedBy.id})`,
      purch.forTournament ? `${purch.forTournament.name} (${purch.forTournament.id})` : 'None',
      purch.purchasedAt.toUTCString()
    ].map((e) => String(e));
  });
  $: sourceBodySliced = sourceBody.slice(
    page.offset * page.limit,
    page.offset * page.limit + page.limit
  );
</script>

<div id="purchases" style="margin: 20px">
  <div id="purchases-paginator" style="margin-bottom: 10px">
    <Paginator bind:settings={page} />
  </div>
  <Table source={{ head: sourceHeaders, body: sourceBodySliced }} />
</div>
