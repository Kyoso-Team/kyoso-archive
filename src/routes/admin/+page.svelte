<script lang="ts">
  import { SEO } from '$components/general';
  import { page } from '$app/stores';
  import { User, Trophy } from 'lucide-svelte';
  import type { AnyComponent } from '$types';

  const links: {
    label: string;
    href: string;
    icon: AnyComponent;
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
    }
  ];
</script>

<SEO page={$page} title="Admin" description="Admin dashboard" noIndex />
<main class="main flex flex-col gap-4 justify-center items-center min-h-full">
  <h1>Admin Panel</h1>
  <div class="flex justify-center flex-wrap gap-4">
    {#each links as { label, href, icon }}
      <a
        href={`/admin/${href}`}
        class="card py-4 w-64 flex flex-col items-center gap-2 hover:variant-soft-primary"
      >
        <svelte:component this={icon} size={64} />
        <span class="inline-block text-lg font-medium">{label}</span>
      </a>
    {/each}
  </div>
</main>
