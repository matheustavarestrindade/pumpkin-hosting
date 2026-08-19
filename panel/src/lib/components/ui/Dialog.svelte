<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		title: string;
		children: Snippet;
		footer?: Snippet;
	};

	let { open = $bindable(false), title, children, footer }: Props = $props();
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) open = false;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') open = false;
		}}
	>
		<div
			class="w-full max-w-md rounded-xl border border-mc-border bg-mc-surface p-5"
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
		>
			<h2 class="mb-4 text-lg font-semibold text-mc-text">{title}</h2>
			{@render children()}
			{#if footer}
				<div class="mt-5 flex justify-end gap-2">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
