<script lang="ts">
  export let target: string;
  export let label: string;
</script>

<div class="text-xs text-center card variant-filled p-2 whitespace-nowrap" data-popup={target}>
  {label}
  <div class="arrow variant-filled" />
</div>