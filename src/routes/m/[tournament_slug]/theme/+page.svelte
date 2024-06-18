<!-- The functionality in this page is likely to move to the assets page (which will be renamed design in that case)-->
<script lang="ts">
  import { writable } from 'svelte/store';
  import { Check } from 'lucide-svelte';
  import { theme as defaultTheme } from '../../../../theme';
  import { portal } from 'svelte-portal';
    import { onMount } from 'svelte';

  const theme = writable({});

  onMount(() => {
    const style = document.createElement('style');
    style.innerHTML = generateCss('Roboto', 'roboto', 'ttf');
    document.head.appendChild(style);
  });

  function rgbColortoHex(color: number) {
    return `0${color.toString(16)}`.slice(-2);
  }

  function rgbToHex(r: number, g: number, b: number): string {
    return `#${rgbColortoHex(r)}${rgbColortoHex(g)}${rgbColortoHex(b)}`;
  }

  function generateCss(fontFamilyName: string, fontFamilyFolder: string, format: string) {
    let css = '';

    for (const weight of [400, 500, 700]) {
      css += `@font-face{font-family:'${fontFamilyName}';src:url('/tournament-fonts/${fontFamilyFolder}/${weight}.${format}');font-weight:${weight};font-style:normal;}`;
      css += `@font-face{font-family:'${fontFamilyName}';src:url('/tournament-fonts/${fontFamilyFolder}/${weight}-italic.${format}');font-weight:${weight};font-style:italic;}`;
    }

    return `${css}:root [data-theme='theme']{--theme-font-family-base:'${fontFamilyName}',sans-serif;--theme-font-family-heading:'${fontFamilyName}',sans-serif;}`;
  }
</script>

<main class="main flex justify-center">
  <div class="w-full max-w-5xl">
    <div class="text-3xl mb-2">The Quick Brown Fox Jumps Over The Lazy Dog.</div>
    <div class="text-3xl mb-2 italic">The Quick Brown Fox Jumps Over The Lazy Dog.</div>
    <div class="text-3xl mb-2 font-medium">The Quick Brown Fox Jumps Over The Lazy Dog.</div>
    <div class="text-3xl mb-2 font-medium italic">The Quick Brown Fox Jumps Over The Lazy Dog.</div>
    <div class="text-3xl mb-2 font-bold">The Quick Brown Fox Jumps Over The Lazy Dog.</div>
    <div class="text-3xl mb-2 font-bold italic">The Quick Brown Fox Jumps Over The Lazy Dog.</div>
    <div class="mt-4 w-full card p-4 flex flex-col gap-4">
      <div class="flex gap-4">
        <div>
          <div class="mb-1">Primary</div>
          <div class="flex gap-2">
            <input type="color" class="input" value={
              rgbToHex(
                Number(defaultTheme.properties['--color-primary-500'].split(' ')[0]),
                Number(defaultTheme.properties['--color-primary-500'].split(' ')[1]),
                Number(defaultTheme.properties['--color-primary-500'].split(' ')[2])
              )
            }>
            <input type="text" class="input w-max" value={rgbToHex(
              Number(defaultTheme.properties['--color-primary-500'].split(' ')[0]),
              Number(defaultTheme.properties['--color-primary-500'].split(' ')[1]),
              Number(defaultTheme.properties['--color-primary-500'].split(' ')[2])
            )}>
          </div>
        </div>
        <div>
          <div class="mb-1">Surface</div>
          <div class="flex gap-2">
            <input type="color" class="input" value={
              rgbToHex(
                Number(defaultTheme.properties['--color-surface-500'].split(' ')[0]),
                Number(defaultTheme.properties['--color-surface-500'].split(' ')[1]),
                Number(defaultTheme.properties['--color-surface-500'].split(' ')[2])
              )
            }>
            <input type="text" class="input w-max" value={rgbToHex(
              Number(defaultTheme.properties['--color-surface-500'].split(' ')[0]),
              Number(defaultTheme.properties['--color-surface-500'].split(' ')[1]),
              Number(defaultTheme.properties['--color-surface-500'].split(' ')[2])
            )}>
          </div>
        </div>
      </div>
      <div class="flex gap-4">
        <div>
          <div class="mb-1">Base font</div>
          <select class="input w-56" disabled />
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" class="checkbox" checked>
            <span>Use system font?</span>
          </div>
        </div>
        <div>
          <div class="mb-1">Headings font</div>
          <select class="input w-56" disabled />
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" class="checkbox" checked>
            <span>Same as base?</span>
          </div>
        </div>
      </div>
      <div class="flex gap-4">
        <div>
          <div class="mb-1">Base font color</div>
          <div class="flex gap-2">
            <div class="rounded-md w-10 h-10 bg-white flex items-center justify-center">
              <Check class="stroke-black" />
            </div>
            <div class="rounded-md w-10 h-10 bg-surface-100" />
            <div class="rounded-md w-10 h-10 bg-primary-100" />
          </div>
        </div>
        <div>
          <div class="mb-1">Headings font color</div>
          <div class="flex gap-2">
            <div class="rounded-md w-10 h-10 bg-white flex items-center justify-center">
              <Check class="stroke-black" />
            </div>
            <div class="rounded-md w-10 h-10 bg-primary-100" />
            <div class="rounded-md w-10 h-10 bg-primary-200" />
            <div class="rounded-md w-10 h-10 bg-primary-300" />
            <div class="rounded-md w-10 h-10 bg-primary-400" />
            <div class="rounded-md w-10 h-10 bg-primary-500" />
          </div>
        </div>
      </div>
      <div>
        <span class="text-warning-500">The above palletes are generated from the first 3 color inputs</span>
      </div>
    </div>
  </div>
</main>