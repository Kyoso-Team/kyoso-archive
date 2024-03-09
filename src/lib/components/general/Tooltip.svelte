<script lang="ts">
  export let target: string;
  export let label: string;
</script>

<div
  class="dark:bg-zinc-800 dark:text-white dark:border-zinc-200/10 border whitespace-nowrap p-2 text-center text-xs shadow-md max-w-48 text-wrap"
  data-popup={target}
>
  {label}
  <div class="arrow dark:bg-zinc-800 dark:border-zinc-200/10 border-b border-r shadow-md" />
</div>
