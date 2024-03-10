<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="w-screen h-full flex flex-col text-center justify-center items-center">
  <h1 class="text-primary-500">{$page.status}</h1>
  <p class="font-medium">{$page.error?.message}</p>
</div>
