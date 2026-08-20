<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
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

<h1 class="text-xl font-bold text-foreground">Create a server</h1>
<p class="mt-1 text-sm text-muted-foreground">Name it, pick a type, done.</p>

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
			<Label for="name">Server name</Label>
			<div class="mt-2">
				<Input id="name" name="name" bind:value={name} placeholder="Steve's world" maxlength={32} required />
			</div>
			{#if subdomain}
				<div class="mt-3 flex flex-wrap items-center gap-2 font-mono text-sm">
					<span class="rounded-md border border-border bg-card px-2 py-1 text-primary">
						{subdomain}.{baseDomain}
					</span>
					{#if checking}
						<span class="text-xs text-muted-foreground">Checking...</span>
					{:else if availability?.available}
						<span class="text-xs text-primary">Available</span>
					{:else if availability}
						<span class="text-xs text-destructive">{availability.reason}</span>
					{/if}
				</div>
			{/if}
		</section>

		<section>
			<p class="text-sm font-medium text-foreground">Server type</p>
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

	<Card.Root class="h-fit lg:sticky lg:top-20">
		<Card.Header>
			<Card.Title class="text-base">Summary</Card.Title>
		</Card.Header>
		<Card.Content>
			<dl class="space-y-2 text-sm">
				<div class="flex justify-between gap-2">
					<dt class="text-muted-foreground">Name</dt>
					<dd class="truncate text-foreground">{name || '-'}</dd>
				</div>
				<div class="flex justify-between gap-2">
					<dt class="text-muted-foreground">Address</dt>
					<dd class="truncate font-mono text-primary">{subdomain ? `${subdomain}.${baseDomain}` : '-'}</dd>
				</div>
				<div class="flex justify-between gap-2">
					<dt class="text-muted-foreground">Type</dt>
					<dd class="capitalize text-foreground">{selectedType}</dd>
				</div>
				<div class="flex justify-between gap-2 border-t border-border pt-2">
					<dt class="text-muted-foreground">Price</dt>
					<dd class="text-foreground">{price}/month</dd>
				</div>
			</dl>

			{#if form?.error}
				<p class="mt-3 text-sm text-destructive">{form.error}</p>
			{/if}

			<Button type="submit" class="mt-5 w-full" disabled={!availability?.available || submitting}>
				{submitting ? 'Creating...' : 'Create server'}
			</Button>
			<p class="mt-3 text-center text-xs text-muted-foreground">Up to 10 players. Cancel anytime.</p>
		</Card.Content>
	</Card.Root>
</form>
