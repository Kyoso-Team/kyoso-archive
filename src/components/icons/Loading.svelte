<script lang="ts">
  export let w: number | undefined = undefined;
  export let h: number | undefined = undefined;
  export let styles: string | undefined = undefined;
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} class={styles} viewBox="0 0 24 24">
  <path d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z" opacity=".5" />
  <path d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z">
    <animateTransform attributeName="transform" dur="1s" from="0 12 12" repeatCount="indefinite" to="360 12 12" type="rotate" />
  </path>
</svg>