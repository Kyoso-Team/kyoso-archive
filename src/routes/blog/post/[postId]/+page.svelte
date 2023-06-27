<script lang="ts">
  import { format } from '$lib/utils';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
</script>

<div class="center-content">
  <div class="document text-left">
    <h1>{data.title}</h1>
    <span class="text-primary-500">Published on:</span> <span> {format.date(new Date(data.published_at))}</span>
    <div class="border-b border-surface-700 absolute left-0 w-screen overflow-hidden mt-8" />
    <div class="mt-16">
      {@html data.body_html}
    </div>
  </div>
</div>