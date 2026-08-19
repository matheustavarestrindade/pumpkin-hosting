<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = HTMLInputAttributes & {
		label?: string;
		error?: string;
		value?: string;
	};

	let { label, error, value = $bindable(''), id, ...rest }: Props = $props();

	const generatedId = Math.random().toString(36).slice(2, 9);
	const inputId = $derived(id ?? `input-${generatedId}`);
</script>

<div class="flex flex-col gap-1.5">
	{#if label}
		<label for={inputId} class="text-sm font-medium text-mc-text">{label}</label>
	{/if}
	<input
		id={inputId}
		bind:value
		class="rounded-lg border bg-mc-bg px-3 py-2 text-sm text-mc-text outline-none placeholder:text-mc-muted focus:border-mc-accent {error
			? 'border-red-500'
			: 'border-mc-border'}"
		{...rest}
	/>
	{#if error}
		<p class="text-xs text-red-400">{error}</p>
	{/if}
</div>
