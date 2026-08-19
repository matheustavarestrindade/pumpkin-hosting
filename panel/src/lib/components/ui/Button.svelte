<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md';
		loading?: boolean;
		children: Snippet;
	};

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		disabled = false,
		type = 'button',
		children,
		...rest
	}: Props = $props();

	const variants = {
		primary: 'bg-mc-accent hover:bg-mc-accent-hover text-white',
		secondary: 'bg-mc-surface border border-mc-border hover:bg-mc-border/50 text-mc-text',
		danger: 'bg-red-600 hover:bg-red-500 text-white',
		ghost: 'hover:bg-mc-surface text-mc-muted hover:text-mc-text'
	};

	const sizes = {
		sm: 'px-2.5 py-1.5 text-sm',
		md: 'px-4 py-2 text-sm'
	};
</script>

<button
	{type}
	disabled={disabled || loading}
	class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 {variants[variant]} {sizes[size]}"
	{...rest}
>
	{#if loading}
		<span class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
	{/if}
	{@render children()}
</button>
