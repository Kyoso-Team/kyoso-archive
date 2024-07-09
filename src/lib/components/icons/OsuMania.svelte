<script lang="ts">
  import { defaultAttributes, mergeClasses } from './utils';

  export let name: string | undefined = undefined;
  export let color = 'currentColor';
  export let size: number | string = 24;
  export let strokeWidth: number | string = 2;
  export let absoluteStrokeWidth: boolean = false;
</script>

<svg
  {...defaultAttributes}
  {...$$restProps}
  width={size}
  height={size}
  stroke={color}
  stroke-width={absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth}
  class={mergeClasses('lucide-icon', 'lucide', name ? `lucide-${name}` : '', $$props.class)}
>
  <path
    d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
  />
  <path d="M12 6V18" />
  <path d="M16 9V15" />
  <path d="M8 9V15" />
</svg>
