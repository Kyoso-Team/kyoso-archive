<script lang="ts">
  export let errors: string[];
</script>

{#if errors.length === 1}
  <span class="text-sm text-error-600">{errors[0]}</span>
{:else if errors.length > 1}
  <ol class="text-sm text-error-600">
    {#each errors as err, i}
      <li>{i + 1}. {err}</li>
    {/each}
  </ol>
{/if}