<script lang="ts">
  export let target: string;
  export let label: string;
</script>

<div
  class="card variant-filled whitespace-nowrap px-2 py-1 text-center text-xs"
  data-popup={target}
>
  {label}
  <div class="arrow variant-filled" />
</div>
