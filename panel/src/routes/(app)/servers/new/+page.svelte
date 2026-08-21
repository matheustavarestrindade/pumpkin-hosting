<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import TypeSelectCard from '$lib/components/server/TypeSelectCard.svelte';
	import RocketIcon from '@lucide/svelte/icons/rocket';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const types = $derived([
		{ id: 'survival', name: m.type_survival(), description: m.type_survival_desc(), image: '/images/types/survival.png' },
		{ id: 'hardcore', name: m.type_hardcore(), description: m.type_hardcore_desc(), image: '/images/types/hardcore.png' },
		{ id: 'creative', name: m.type_creative(), description: m.type_creative_desc(), image: '/images/types/creative.png' },
		{ id: 'flat', name: m.type_flat(), description: m.type_flat_desc(), image: '/images/types/flat.png' }
	] as const);

	let selectedType = $state<string>('survival');
	let submitting = $state(false);

	const price = $derived(
		new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: data.plan?.currency ?? 'brl'
		}).format((data.plan?.priceCents ?? 1000) / 100)
	);
</script>

<svelte:head>
	<title>{m.new_title()} - hosting-mc</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
	<h1 class="text-2xl font-bold text-foreground">{m.new_title()}</h1>
	<p class="mt-1 text-sm text-muted-foreground">{m.new_sub()}</p>

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
		<input type="hidden" name="type" value={selectedType} />

		<section>
			<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{m.new_gamemode_label()}</p>
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

		<div class="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-sm text-muted-foreground">
			<SparklesIcon class="size-4 shrink-0 text-primary" />
			{m.new_random_hint()}
		</div>

		{#if form?.error}
			<p class="text-sm text-destructive">{form.error}</p>
		{/if}

		<Button type="submit" size="lg" class="w-full" disabled={submitting}>
			<RocketIcon /> {submitting ? m.new_launching() : m.new_launch({ price })}
		</Button>
	</form>
</div>
