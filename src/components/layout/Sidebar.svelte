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

{#if $sidebar}
  <div
    class={`hidden h-full fill-white 2lg:grid ${
      $sidebar.columns === 1 ? 'grid-cols-[auto]' : 'grid-cols-[auto_auto]'
    }`}
  >
    <svelte:component this={$sidebar?.component} />
  </div>
  <button
    class="flex h-full w-8 items-center justify-center border-r border-surface-500/50 bg-black bg-opacity-20 duration-150 hover:bg-opacity-30 2lg:hidden"
    on:click={onShowResponsive}
  >
    <MoveUpIcon w={20} h={20} styles="rotate-90 fill-primary-500" />
  </button>
  {#if showResponsive}
    <div
      class="fixed left-0 top-[66px] z-20 h-screen w-screen overflow-hidden bg-surface-backdrop-token"
    />
    <div
      class={`fixed left-0 top-[66px] z-30 grid h-full fill-white ${
        $sidebar.columns === 1 ? 'grid-cols-[auto_auto]' : 'grid-cols-[auto_auto_auto]'
      }`}
    >
      <svelte:component this={$sidebar?.component} />
      <div class="border-r border-surface-500/50 bg-surface-900">
        <button
          class="flex h-full w-8 items-center justify-center bg-black bg-opacity-20 duration-150 hover:bg-opacity-30"
          on:click={onHideResponsive}
        >
          <MoveUpIcon w={20} h={20} styles="rotate-[270deg] fill-primary-500" />
        </button>
      </div>
    </div>
  {/if}
{/if}
