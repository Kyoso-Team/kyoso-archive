<script lang="ts">
  export let target: string;
  export let label: string;
  export let arrowBorders = 'border-b border-r';
  export let visibility = 'block';
</script>

<div data-popup={target}>
  <div
    class={`dark:bg-zinc-800 dark:text-white dark:border-zinc-200/10 border p-2 text-center w-max text-xs shadow-md max-w-56 z-30 rounded-md ${visibility}`}
  >
    {label}
    <div class={`arrow dark:bg-zinc-800 dark:border-zinc-200/10 shadow-md ${arrowBorders}`} />
  </div>
</div>
