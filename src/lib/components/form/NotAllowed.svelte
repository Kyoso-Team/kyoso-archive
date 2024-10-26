<script lang="ts">
  import { User } from 'lucide-svelte';
  import { Tooltip } from '$lib/components/general';
  import { popup } from '$lib/popup';
  import { tooltip } from '$lib/utils';

  export let inputLabel: string;
  export let tooltipLabel: string;
</script>

<button
  class="card variant-soft-error rounded-md w-6 h-6 flex justify-center items-center [&>*]:pointer-events-none cursor-default"
  use:popup={tooltip(`not-allowed-${inputLabel}`)}
>
  <User size={16} class="stroke-current" />
</button>
<Tooltip target={`not-allowed-${inputLabel}`} label={tooltipLabel} />
