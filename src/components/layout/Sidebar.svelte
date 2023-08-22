<script lang="ts">
  import { MoveUpIcon } from '$components';
  import { sidebar } from '$stores';

  let showResponsive = false;

  function onShowResponsive() {
    showResponsive = true;
  }

  function onHideResponsive() {
    showResponsive = false;
  }
</script>

{#if $sidebar?.component}
  <div class={`hidden 2lg:grid h-full fill-white ${$sidebar.columns === 1 ? 'grid-cols-[auto]' : 'grid-cols-[auto_auto]'}`}>
    <svelte:component this={$sidebar?.component} />
  </div>
  <button class="flex justify-center items-center 2lg:hidden w-8 border-r border-surface-500/50 h-full bg-black bg-opacity-20 hover:bg-opacity-30 duration-150" on:click={onShowResponsive}>
    <MoveUpIcon w={20} h={20} styles="rotate-90 fill-primary-500" />
  </button>
  {#if showResponsive}
    <div class="fixed w-screen h-screen overflow-hidden bg-surface-backdrop-token top-[66px] z-20 left-0" />
    <div class={`fixed z-30 top-[66px] left-0 grid h-full fill-white ${$sidebar.columns === 1 ? 'grid-cols-[auto_auto]' : 'grid-cols-[auto_auto_auto]'}`}>
      <svelte:component this={$sidebar?.component} />
      <div class="bg-surface-900 border-r border-surface-500/50">
        <button class="flex justify-center items-center w-8 h-full bg-black bg-opacity-20 hover:bg-opacity-30 duration-150" on:click={onHideResponsive}>
          <MoveUpIcon w={20} h={20} styles="rotate-[270deg] fill-primary-500" />
        </button>
      </div>
    </div>
  {/if}
{/if}
