<script lang="ts">
  import { Tooltip } from '$lib/components/general';
  import { popup } from '$lib/popup';
  import { tooltip } from '$lib/utils';

  export let kyosoBadges: {
    label: string;
    description: string;
    tooltipName: string;
    variant: string;
    show: boolean;
  }[];
  export let responsive = false;
  let styles = '';
  export { styles as class };
</script>

{#each kyosoBadges as { label, description, tooltipName, variant, show }}
  {#if show}
    <button
      class={`badge cursor-default ${variant} ${styles}`.trim()}
      use:popup={tooltip(responsive ? `responsive-${tooltipName}` : tooltipName)}>{label}</button
    >
    <Tooltip target={responsive ? `responsive-${tooltipName}` : tooltipName} label={description} />
  {/if}
{/each}
