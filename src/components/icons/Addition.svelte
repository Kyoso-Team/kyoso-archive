<script lang="ts">
  export let w: number | undefined = undefined;
  export let h: number | undefined = undefined;
  export let styles: string | undefined = undefined;
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} class={styles} viewBox="0 0 24 24">
  <path fill="currentColor" d="M18 10h-4V6a2 2 0 0 0-4 0l.071 4H6a2 2 0 0 0 0 4l4.071-.071L10 18a2 2 0 0 0 4 0v-4.071L18 14a2 2 0 0 0 0-4z" />
</svg>