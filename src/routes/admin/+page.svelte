<script lang="ts">
  import { Trophy, User, TestTube2 } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { SEO } from '$lib/components/general';
  import type { SvelteComponent } from 'svelte';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  const links: {
    label: string;
    href: string;
    icon: typeof SvelteComponent<any>;
  }[] = [
    {
      label: 'Manage Users',
      href: 'users',
      icon: User
    },
    {
      label: 'Manage Tournaments',
      href: 'tournaments',
      icon: Trophy
    },
    !data.isProduction ? {
      label: 'Manage Testers',
      href: 'testers',
      icon: TestTube2
    } : null
  ].filter((link) => !!link);
</script>

<SEO page={$page} title="Admin" description="Admin dashboard" noIndex />
<main class="main justify-center">
  <div class="page-content">
    <h1>Admin Panel</h1>
    <div class="line-b" />
    <div class="grid sm:w-[calc(100%-1rem)] sm:grid-cols-[50%_50%] gap-4">
      {#each links as { label, href, icon }}
        <a
          href={`/admin/${href}`}
          class="card py-4 flex w-full flex-col items-center gap-2 hover:variant-soft-primary"
        >
          <svelte:component this={icon} size={64} />
          <span class="inline-block text-lg font-medium">{label}</span>
        </a>
      {/each}
    </div>
  </div>
</main>
