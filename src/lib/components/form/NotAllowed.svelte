<script lang="ts">
  import { popup } from '$lib/popup';
  import { tooltip } from '$lib/utils';
  import { User } from 'lucide-svelte';
  import { Tooltip } from '$components/general';

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
