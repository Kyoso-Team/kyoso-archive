<script lang="ts">
  import { Setting, Settings } from '$components';
  import { z } from 'zod';
  import { setSettingError, trimStringValues } from '$lib/utils';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { error } from '$stores';
  import type { PageServerData } from './$types';

  export let data: PageServerData;

  let originalObj = {
    ...data,
    forumPostId: data.forumPostId?.toString() || (undefined as string | null | undefined)
  };
  let currentObj = { ...originalObj };
  let errors: Partial<
    Record<'forum' | 'discord' | 'sheet' | 'twitch' | 'youtube' | 'donation' | 'website', string>
  > = {};

  $: {
    let {
      forumPostId,
      discordInviteId,
      donationLink,
      mainSheetId,
      twitchChannelName,
      websiteLink,
      youtubeChannelId,
      id
    } = currentObj;

    currentObj = {
      id,
      donationLink,
      websiteLink,
      forumPostId: forumPostId?.startsWith('https')
        ? forumPostId?.replace('https://osu.ppy.sh/community/forums/topics/', '').split('?')[0]
        : forumPostId,
      discordInviteId: discordInviteId?.startsWith('https')
        ? discordInviteId?.replace('https://discord.gg/', '')
        : discordInviteId,
      mainSheetId: mainSheetId?.startsWith('https')
        ? mainSheetId?.replace('https://docs.google.com/spreadsheets/d/', '').split('/edit')[0]
        : mainSheetId,
      twitchChannelName: twitchChannelName?.startsWith('https')
        ? twitchChannelName.replace('https://www.twitch.tv/', '')
        : twitchChannelName,
      youtubeChannelId: youtubeChannelId?.startsWith('https')
        ? youtubeChannelId.replace('https://www.youtube.com/channel/', '')
        : youtubeChannelId
    };
  }

  $: {
    let forum = z
        .number()
        .int()
        .gte(1)
        .nullish()
        .safeParse(currentObj.forumPostId ? Number(currentObj.forumPostId) : null),
      discord = z.string().max(12).nullish().safeParse(currentObj.discordInviteId),
      sheet = z.string().max(45).nullish().safeParse(currentObj.mainSheetId),
      twitch = z.string().max(25).nullish().safeParse(currentObj.twitchChannelName),
      youtube = z.string().max(25).nullish().safeParse(currentObj.youtubeChannelId),
      donation = z.string().url().nullish().safeParse(currentObj.donationLink),
      website = z.string().url().nullish().safeParse(currentObj.websiteLink);

    errors = {
      forum: setSettingError(forum),
      discord: setSettingError(discord),
      sheet: setSettingError(sheet),
      twitch: setSettingError(twitch),
      youtube: setSettingError(youtube),
      donation: setSettingError(donation),
      website: setSettingError(website)
    };
  }

  function onUndo() {
    currentObj = originalObj;
  }

  async function onUpdate() {
    currentObj = trimStringValues(currentObj);

    try {
      await trpc($page).tournaments.updateTournament.mutate({
        tournamentId: data.id,
        where: {
          id: data.id
        },
        data: {
          ...currentObj,
          forumPostId: Number(currentObj.forumPostId)
        }
      });

      originalObj = currentObj;
    } catch (err) {
      console.error(err);
      error.set($error, err, 'close', true);
    }
  }

  function setLink(value: string | null | undefined, prefix: string = '') {
    if (!value) return undefined;
    return value.startsWith('https://') ? value : `${prefix}${value}`;
  }
</script>

<div class="center-content">
  <h1 class="pb-4">Settings</h1>
  <Settings
    tournamentId={data.id}
    tab={2}
    on:undo={onUndo}
    on:update={onUpdate}
    {currentObj}
    {originalObj}
    {errors}
  >
    <svelte:fragment slot="header">
      <span class="mb-1 block text-sm"
        ><strong>Note:</strong> Full links are supported as input.</span
      >
    </svelte:fragment>
    <Setting
      label="Forum post ID"
      type="string"
      error={errors.forum}
      link={setLink(currentObj.forumPostId, 'https://osu.ppy.sh/community/forums/topics/')}
      isLink
      bind:value={currentObj.forumPostId}
    />
    <Setting
      label="Discord server invite ID"
      type="string"
      error={errors.discord}
      link={setLink(currentObj.discordInviteId, 'https://discord.gg/')}
      isLink
      bind:value={currentObj.discordInviteId}
    />
    <Setting
      label="Main sheet ID"
      type="string"
      error={errors.sheet}
      link={setLink(currentObj.mainSheetId, 'https://docs.google.com/spreadsheets/d/')}
      isLink
      bind:value={currentObj.mainSheetId}
    />
    <Setting
      label="Twitch channel name"
      type="string"
      error={errors.twitch}
      link={setLink(currentObj.twitchChannelName, 'https://www.twitch.tv/')}
      isLink
      bind:value={currentObj.twitchChannelName}
    />
    <Setting
      label="Youtube channel ID"
      type="string"
      error={errors.youtube}
      link={setLink(currentObj.youtubeChannelId, 'https://www.youtube.com/channel/')}
      isLink
      bind:value={currentObj.youtubeChannelId}
    />
    <Setting
      label="Donation link"
      type="string"
      error={errors.donation}
      link={setLink(currentObj.donationLink)}
      isLink
      bind:value={currentObj.donationLink}
    />
    <Setting
      label="Website link"
      type="string"
      error={errors.website}
      link={setLink(currentObj.websiteLink)}
      isLink
      final
      bind:value={currentObj.websiteLink}
    />
  </Settings>
</div>
