<script lang="ts">
  import { popup } from '$lib/popup';
  import { tooltip } from '$lib/utils';
  import { TriangleAlert } from 'lucide-svelte';
  import { Tooltip } from '$lib/components/general';

  export let inputLabel: string;
  export let tooltipLabel: string;
</script>

<button
  class="card variant-soft-warning rounded-md w-6 h-6 flex justify-center items-center [&>*]:pointer-events-none cursor-default"
  use:popup={tooltip(`warning-${inputLabel}`)}
>
  <TriangleAlert size={16} class="stroke-current" />
</button>
<Tooltip target={`warning-${inputLabel}`} label={tooltipLabel} />
