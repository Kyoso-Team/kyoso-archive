<script lang="ts">
  import '../theme.css';
  import '@skeletonlabs/skeleton/styles/all.css';
  import { setInitialClassState } from '@skeletonlabs/skeleton';
</script>

<svelte:head>
  {@html `<script>(${setInitialClassState.toString()})();</script>`}
</svelte:head>
<slot />
