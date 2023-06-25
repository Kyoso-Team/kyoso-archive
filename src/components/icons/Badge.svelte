<script lang="ts">
  export let w: number | undefined = undefined;
  export let h: number | undefined = undefined;
  export let styles: string | undefined = undefined;
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} class={styles} viewBox="0 0 20 20">
  <path d="M10 12a6 6 0 1 1 0-12a6 6 0 0 1 0 12zm0-3a3 3 0 1 0 0-6a3 3 0 0 0 0 6zm4 2.75V20l-4-4l-4 4v-8.25a6.97 6.97 0 0 0 8 0z" />
</svg>