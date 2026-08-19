<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		right?: Snippet;
	};

	let { children, right }: Props = $props();
</script>

<header class="border-b border-mc-border bg-mc-bg">
	<div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
		<a href="/" class="flex items-center gap-2 font-semibold text-mc-text">
			<span class="flex size-6 items-center justify-center rounded bg-mc-accent text-sm font-bold text-white">H</span>
			hosting-mc
		</a>
		<nav class="flex items-center gap-6 text-sm text-mc-muted">
			{@render children?.()}
		</nav>
		{#if right}
			<div class="flex items-center gap-2">
				{@render right()}
			</div>
		{/if}
	</div>
</header>
