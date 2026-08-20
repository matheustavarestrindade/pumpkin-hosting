<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import TypeSelectCard from '$lib/components/server/TypeSelectCard.svelte';
	import RocketIcon from '@lucide/svelte/icons/rocket';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const baseDomain = env.PUBLIC_BASE_DOMAIN ?? 'example.com';

	const types = [
		{ id: 'survival', name: 'Survival', description: 'Classic experience', image: '/images/types/survival.png' },
		{ id: 'hardcore', name: 'Hardcore', description: 'One life only', image: '/images/types/hardcore.png' },
		{ id: 'creative', name: 'Creative', description: 'Infinite resources', image: '/images/types/creative.png' },
		{ id: 'flat', name: 'Superflat', description: "Builder's canvas", image: '/images/types/flat.png' }
	] as const;

	let name = $state('');
	let selectedType = $state<string>('survival');
	let checking = $state(false);
	let availability = $state<{ available: boolean; reason?: string } | null>(null);
	let submitting = $state(false);

	const subdomain = $derived(
		name
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
	);

	const price = $derived(
		new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: data.plan?.currency ?? 'brl'
		}).format((data.plan?.priceCents ?? 1000) / 100)
	);

	let checkTimer: ReturnType<typeof setTimeout>;
	$effect(() => {
		if (!subdomain) {
			availability = null;
			return;
		}
		clearTimeout(checkTimer);
		checkTimer = setTimeout(async () => {
			checking = true;
			const res = await fetch(`/api/subdomain?name=${encodeURIComponent(subdomain)}`);
			availability = await res.json();
			checking = false;
		}, 300);
	});
</script>

<svelte:head>
	<title>New server - hosting-mc</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
	<h1 class="text-2xl font-bold text-foreground">New Adventure</h1>
	<p class="mt-1 text-sm text-muted-foreground">Configure your new Minecraft server.</p>

	<form
		method="POST"
		action="?/create"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update();
			};
		}}
		class="mt-6 flex flex-col gap-8"
	>
		<input type="hidden" name="subdomain" value={subdomain} />
		<input type="hidden" name="type" value={selectedType} />

		<section>
			<Label for="name" class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				Server Name
			</Label>
			<div class="mt-2">
				<Input
					id="name"
					name="name"
					bind:value={name}
					placeholder="e.g. The Overworld"
					maxlength={32}
					required
					class="h-12 rounded-xl bg-input"
				/>
			</div>
			{#if subdomain}
				<div class="mt-3 flex flex-wrap items-center gap-2 font-mono text-sm">
					<span class="rounded-lg border border-border bg-card px-2 py-1 text-primary">
						{subdomain}.{baseDomain}
					</span>
					{#if checking}
						<span class="text-xs text-muted-foreground">Checking...</span>
					{:else if availability?.available}
						<span class="text-xs font-medium text-primary">Available</span>
					{:else if availability}
						<span class="text-xs font-medium text-destructive">{availability.reason}</span>
					{/if}
				</div>
			{/if}
		</section>

		<section>
			<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Select Gamemode</p>
			<div class="mt-3 grid grid-cols-2 gap-3">
				{#each types as t (t.id)}
					<TypeSelectCard
						name={t.name}
						description={t.description}
						image={t.image}
						selected={selectedType === t.id}
						onselect={() => (selectedType = t.id)}
					/>
				{/each}
			</div>
		</section>

		{#if form?.error}
			<p class="text-sm text-destructive">{form.error}</p>
		{/if}

		<div class="sticky bottom-20 md:bottom-6">
			<Button
				type="submit"
				size="lg"
				class="h-13 w-full rounded-xl text-base shadow-lg"
				disabled={!availability?.available || submitting}
			>
				<RocketIcon /> {submitting ? 'Launching...' : `Launch Server · ${price}/month`}
			</Button>
		</div>
	</form>
</div>
