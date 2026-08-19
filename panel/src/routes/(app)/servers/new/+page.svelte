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

	let step = $state(1);
	let name = $state('');
	let selectedType = $state<string>('survival');
	let checking = $state(false);
	let availability = $state<{ available: boolean; reason?: string } | null>(null);

	const subdomain = $derived(
		name
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
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

<div class="mt-2 flex items-center gap-2 text-sm text-mc-muted">
	{#each ['Name', 'Type', 'Confirm'] as label, i (label)}
		<span class={step >= i + 1 ? 'text-mc-text font-medium' : ''}>{i + 1}. {label}</span>
		{#if i < 2}<span class="text-mc-border">/</span>{/if}
	{/each}
</div>

<form method="POST" action="?/create" use:enhance class="mt-6">
	<input type="hidden" name="subdomain" value={subdomain} />
	<input type="hidden" name="type" value={selectedType} />

	{#if step === 1}
		<Card class="max-w-md">
			<Input label="Server name" bind:value={name} name="name" placeholder="Steve's world" maxlength={32} required />
			{#if subdomain}
				<p class="mt-3 font-mono text-sm">
					<span class="text-mc-muted">Address:</span>
					<span class="text-mc-accent">{subdomain}.{baseDomain}</span>
				</p>
				{#if checking}
					<p class="mt-1 text-xs text-mc-muted">Checking...</p>
				{:else if availability}
					{#if availability.available}
						<p class="mt-1 text-xs text-green-400">Available</p>
					{:else}
						<p class="mt-1 text-xs text-red-400">{availability.reason}</p>
					{/if}
				{/if}
			{/if}
			<div class="mt-5 flex justify-end">
				<Button type="button" disabled={!availability?.available} onclick={() => (step = 2)}>Next</Button>
			</div>
		</Card>
	{/if}

	{#if step === 2}
		<div class="grid max-w-3xl gap-4 sm:grid-cols-2">
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
		<div class="mt-5 flex gap-2">
			<Button type="button" variant="secondary" onclick={() => (step = 1)}>Back</Button>
			<Button type="button" onclick={() => (step = 3)}>Next</Button>
		</div>
	{/if}

	{#if step === 3}
		<Card class="max-w-md">
			<dl class="space-y-2 text-sm">
				<div class="flex justify-between">
					<dt class="text-mc-muted">Name</dt>
					<dd class="text-mc-text">{name}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-mc-muted">Address</dt>
					<dd class="font-mono text-mc-accent">{subdomain}.{baseDomain}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-mc-muted">Type</dt>
					<dd class="text-mc-text capitalize">{selectedType}</dd>
				</div>
				<div class="flex justify-between border-t border-mc-border pt-2">
					<dt class="text-mc-muted">Price</dt>
					<dd class="text-mc-text">€{((data.plan?.priceCents ?? 300) / 100).toFixed(0)}/month</dd>
				</div>
			</dl>
			{#if form?.error}
				<p class="mt-3 text-sm text-red-400">{form.error}</p>
			{/if}
			<div class="mt-5 flex gap-2">
				<Button type="button" variant="secondary" onclick={() => (step = 2)}>Back</Button>
				<Button type="submit">Create server</Button>
			</div>
		</Card>
	{/if}
</form>
