<script lang="ts">
  import { formatDate, formatTime } from '$lib/utils';
  import { Pencil, X } from 'lucide-svelte';
  import type { TournamentDates } from '$db';

  export let date: typeof TournamentDates.$inferSelect['other'][number];
  export let onUpdate: () => void;
  export let onDelete: () => void;

  $: fromDate = new Date(date.fromDate);
  $: toDate = date.toDate ? new Date(date.toDate) : undefined;
</script>

<div class="card grid grid-cols-[1fr_auto] gap-4 w-full bg-surface-200-700-token p-4">
  <div>
    <span class="block font-medium">{date.label}</span>
    <span class="block text-surface-600-300-token text-sm">
      {date.onlyDate ? formatDate(fromDate, 'shortened') : `${formatDate(fromDate, 'shortened')}, ${formatTime(fromDate)}`}
      {toDate ? date.onlyDate ? ` - ${formatDate(toDate, 'shortened')}` : ` - ${formatDate(toDate, 'shortened')}, ${formatTime(toDate)}` : ''}
    </span>
  </div>
  <div class="flex items-center justify-end gap-2">
    <button class="btn btn-icon variant-filled" on:click={onUpdate}>
      <Pencil size={20} />
    </button>
    <button class="btn btn-icon variant-filled-error" on:click={onDelete}>
      <X size={20} />
    </button>
  </div>
</div>