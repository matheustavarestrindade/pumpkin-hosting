<script lang="ts">
	type Props = {
		checked?: boolean;
		label?: string;
		name?: string;
		disabled?: boolean;
	};

	let { checked = $bindable(false), label, name, disabled = false }: Props = $props();
</script>

<label class="inline-flex cursor-pointer items-center gap-2 {disabled ? 'opacity-50' : ''}">
	<button
		type="button"
		role="switch"
		aria-checked={checked}
		aria-label={label ?? 'toggle'}
		{disabled}
		onclick={() => (checked = !checked)}
		class="relative h-5 w-9 rounded-full transition-colors {checked ? 'bg-mc-accent' : 'bg-mc-border'}"
	>
		<span
			class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform {checked
				? 'translate-x-4'
				: ''}"
		></span>
	</button>
	{#if name}
		<input type="checkbox" {name} bind:checked class="hidden" tabindex="-1" aria-hidden="true" />
	{/if}
	{#if label}
		<span class="text-sm text-mc-text">{label}</span>
	{/if}
</label>
