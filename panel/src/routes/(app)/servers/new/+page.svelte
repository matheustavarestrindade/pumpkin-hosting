<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import TypeSelectCard from '$lib/components/server/TypeSelectCard.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const baseDomain = env.PUBLIC_BASE_DOMAIN ?? 'example.com';

	const types = [
		{ id: 'survival', name: 'Survival', description: 'Gather, build, survive. The classic.', image: '/images/types/survival.png' },
		{ id: 'creative', name: 'Creative', description: 'Unlimited blocks. Just build.', image: '/images/types/creative.png' },
		{ id: 'hardcore', name: 'Hardcore', description: 'One life. Hard difficulty.', image: '/images/types/hardcore.png' },
		{ id: 'flat', name: 'Flat', description: 'A flat world for big projects.', image: '/images/types/flat.png' }
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

<h1 class="text-xl font-bold text-mc-text">Create a server</h1>
<p class="mt-1 text-sm text-mc-muted">Name it, pick a type, done.</p>

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
	class="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]"
>
	<input type="hidden" name="subdomain" value={subdomain} />
	<input type="hidden" name="type" value={selectedType} />

	<div class="flex flex-col gap-6">
		<section>
			<label for="name" class="text-sm font-medium text-mc-text">Server name</label>
			<div class="mt-1.5">
				<Input id="name" name="name" bind:value={name} placeholder="Steve's world" maxlength={32} required />
			</div>
			{#if subdomain}
				<div class="mt-3 flex flex-wrap items-center gap-2 font-mono text-sm">
					<span class="rounded border border-mc-border bg-mc-surface px-2 py-1 text-mc-accent">
						{subdomain}.{baseDomain}
					</span>
					{#if checking}
						<span class="text-xs text-mc-muted">Checking...</span>
					{:else if availability?.available}
						<span class="text-xs text-green-400">Available</span>
					{:else if availability}
						<span class="text-xs text-red-400">{availability.reason}</span>
					{/if}
				</div>
			{/if}
		</section>

		<section>
			<p class="text-sm font-medium text-mc-text">Server type</p>
			<div class="mt-2 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
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
	</div>

	<Card class="h-fit lg:sticky lg:top-6">
		<h2 class="font-semibold text-mc-text">Summary</h2>
		<dl class="mt-3 space-y-2 text-sm">
			<div class="flex justify-between gap-2">
				<dt class="text-mc-muted">Name</dt>
				<dd class="truncate text-mc-text">{name || '-'}</dd>
			</div>
			<div class="flex justify-between gap-2">
				<dt class="text-mc-muted">Address</dt>
				<dd class="truncate font-mono text-mc-accent">{subdomain ? `${subdomain}.${baseDomain}` : '-'}</dd>
			</div>
			<div class="flex justify-between gap-2">
				<dt class="text-mc-muted">Type</dt>
				<dd class="capitalize text-mc-text">{selectedType}</dd>
			</div>
			<div class="flex justify-between gap-2 border-t border-mc-border pt-2">
				<dt class="text-mc-muted">Price</dt>
				<dd class="text-mc-text">{price}/month</dd>
			</div>
		</dl>

		{#if form?.error}
			<p class="mt-3 text-sm text-red-400">{form.error}</p>
		{/if}

		<Button type="submit" class="mt-5 w-full" disabled={!availability?.available} loading={submitting}>
			Create server
		</Button>
		<p class="mt-3 text-center text-xs text-mc-muted">Up to 10 players. Cancel anytime.</p>
	</Card>
</form>
