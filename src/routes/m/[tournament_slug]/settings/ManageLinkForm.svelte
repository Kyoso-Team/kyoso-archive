<script lang="ts">
  import { Link } from 'lucide-svelte';
  import { tournamentLinkChecks } from '$lib/checks';
  import { Form, Select, Text } from '$lib/components/form';
  import * as f from '$lib/form/validation';
  import { createForm, toast } from '$lib/stores';
  import { keys } from '$lib/utils';
  import type { Tournament } from '$db';
  import type { TournamentLink } from '$lib/types';

  export let show: boolean;
  export let linksHaveUpdated: boolean;
  export let links: ((typeof Tournament.$inferSelect)['links'][number] & { id: string })[];
  export let editIndex: number | undefined = undefined;
  const updating = editIndex !== undefined ? links[editIndex] : undefined;
  const iconOptions: Record<TournamentLink['icon'], string> = {
    challonge: 'Challonge',
    discord: 'Discord',
    donation: 'Donation',
    google_docs: 'Google Docs',
    google_forms: 'Google Forms',
    google_sheets: 'Google Sheets',
    liquipedia: 'Liquipedia',
    osu: 'osu!',
    twitch: 'Twitch',
    website: 'Website',
    x: 'X (Twitter)',
    youtube: 'YouTube'
  };
  const mainForm = createForm(
    {
      label: f.pipe(f.string(), f.minStrLength(2), f.maxStrLength(30)),
      url: f.pipe(f.string(), f.url()),
      icon: f.union(keys(iconOptions))
    },
    updating
  );
  const labels = mainForm.labels;
  const iconSize = 48;

  async function submit() {
    const { label, url, icon } = mainForm.getFinalValue($mainForm);

    const newLink: (typeof links)[number] = {
      label,
      url,
      icon,
      id: label
    };

    const err = tournamentLinkChecks(links, newLink);

    if (err) {
      toast.error(err);
      return;
    }

    if (editIndex !== undefined) {
      links[editIndex] = newLink;
    } else {
      links.push(newLink);
    }

    links = [...links];
    show = false;
    linksHaveUpdated = true;

    setTimeout(() => {
      editIndex = undefined;
    }, 150);
  }

  function cancel() {
    show = false;

    setTimeout(() => {
      editIndex = undefined;
    }, 150);
  }
</script>

<Form {submit}>
  <svelte:fragment slot="header">
    <span class="title">{editIndex !== undefined ? 'Edit' : 'Add'} Link</span>
  </svelte:fragment>
  <Text form={mainForm} label={labels.label} legend="Link label">What is this link for?</Text>
  <Text form={mainForm} label={labels.url} legend="URL" />
  <Select form={mainForm} label={labels.icon} legend="Icon" options={iconOptions}>
    <svelte:fragment slot="preview">
      Icon preview
      <div class="w-full card bg-surface-200-700-token flex justify-center mt-1 p-1">
        <!-- TODO: Add icons, the below is just a placeholder -->
        {#if $mainForm.value.icon}
          <Link size={iconSize} class="dark:stroke-white stroke-black" />
        {:else}
          <span
            class="text-surface-600-300-token flex items-center"
            style={`height: ${iconSize}px;`}>No icon selected</span
          >
        {/if}
        <!-- {#if $mainForm.value.icon === 'challonge'}
        {:else if $mainForm.value.icon === 'discord'}
          <Discord w={iconSize} h={iconSize} class="dark:stroke-white stroke-black" />
        {:else if $mainForm.value.icon === 'donation'}
          <Heart size={iconSize} class="dark:stroke-white stroke-black" />
        {:else if $mainForm.value.icon === 'google_docs'}
        {:else if $mainForm.value.icon === 'google_forms'}
        {:else if $mainForm.value.icon === 'google_sheets'}
        {:else if $mainForm.value.icon === 'liquipedia'}
        {:else if $mainForm.value.icon === 'osu'}
        {:else if $mainForm.value.icon === 'twitch'}
        {:else if $mainForm.value.icon === 'website'}
        {:else if $mainForm.value.icon === 'x'}
        {:else if $mainForm.value.icon === 'youtube'}
        {:else}
          <span class="text-surface-600-300-token flex items-center" style={`height: ${iconSize}px;`}>No icon selected</span>
        {/if} -->
      </div>
    </svelte:fragment>
  </Select>
  <svelte:fragment slot="actions">
    <button
      type="submit"
      class="btn variant-filled-primary"
      disabled={!($mainForm.canSubmit && (editIndex !== undefined ? $mainForm.hasUpdated : true))}
      >Submit</button
    >
    <button type="button" class="btn variant-filled" on:click={cancel}>Cancel</button>
  </svelte:fragment>
</Form>
