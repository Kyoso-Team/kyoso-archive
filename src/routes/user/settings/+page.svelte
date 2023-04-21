<script lang="ts">
  import type { PageServerData } from './$types';
	import { SlideToggle, Table, Modal, modalStore} from '@skeletonlabs/skeleton';

  export let data: PageServerData;
	let user = data.user

	function confirmDiscordChange() {
		modalStore.trigger({
			type: "confirm",
			title: "Please confirm!",
			body: "Do you really want to change which Discord account is linked to Kyoso?",
			response: async (r: Boolean) => {
				if (r === true) {
					let response = await fetch('/user/settings/discord', {
						method: 'POST'
					});
					window.location.href = await response.text()
				}
			}
		})
	}

	function confirmKeyReset() {
		modalStore.trigger({
			type: "confirm",
			title: "Please confirm!",
			body: "Do you really want to reset your Kyoso API key?",
			response: (r: Boolean) => {
				if (r === true) {
					console.log("...reset the api key")
				}
			}
		})
	}

	let head_purchases = ["Purchase Date", "Cost", "Services", "Tournament", "PayPal Order ID"]
	let purchases = data.purchases.map((purch) => {
		return [
			purch.purchasedAt.toUTCString(),
			`US$${purch.cost.toFixed(2)}`,
			String(purch.services).replace(/,/g, ", "),
			purch.forTournament ? purch.forTournament.name : "None",
			purch.paypalOrderId
		].map((x) => String(x))
	})
	$: visibleDiscord = true

	let apiKeyInput: HTMLInputElement;
  let apiReveal: HTMLButtonElement;

	function revealApiKey() {
		apiKeyInput.classList.remove("hidden")
		apiReveal.classList.add("hidden")
	}
</script>

<Modal />
<div class="m-8 p-4 bg-surface-800 rounded-lg">
	<section class="mb-4 inline-grid">
		<h2 class="mb-2">
			Discord
		</h2>
		<p>Should your Discord tag be publicly visible?</p>
		<SlideToggle name="slider-label" active="bg-primary-500" bind:checked={visibleDiscord}>Your Discord Tag is {visibleDiscord ? "" : "NOT "}visible!</SlideToggle>
		<button on:click={confirmDiscordChange} class="btn variant-filled-error mt-4">CHANGE DISCORD ACCOUNT</button>
	</section>
	<section class="mb-4">
		<h2 class="mb-2">
			Purchases
		</h2>
		{#if purchases.length}
			<p>Here are the purchases you have made so far:</p>
			<Table source={{head: head_purchases, body: purchases}} color="variant-soft-tertiary" />
		{:else}
			<p>Your purchases will appear here!</p>
		{/if}
	</section>
	<section>
		<h2 class="mb-2">
			API key
		</h2>
		<p>The key below could help you with using Kyoso, make sure to never share it with anyone!</p>
		<input bind:this={apiKeyInput} type="text" class="input w-auto hidden" value={user.apiKey} readonly>
		<button bind:this={apiReveal} on:click={revealApiKey} class="btn variant-filled-primary">Reveal key</button>
		<button on:click={confirmKeyReset} class="btn variant-filled-error">RESET KEY</button>
	</section>
</div>
