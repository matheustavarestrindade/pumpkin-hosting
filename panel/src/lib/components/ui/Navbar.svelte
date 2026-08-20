<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		right?: Snippet;
	};

	let { children, right }: Props = $props();
</script>

<header class="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
	<div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
		<a href="/" class="flex items-center gap-2 font-semibold text-foreground">
			<span class="flex size-6 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">H</span>
			hosting-mc
		</a>
		<nav class="flex items-center gap-4 text-sm text-muted-foreground">
			{@render children?.()}
		</nav>
		{#if right}
			<div class="flex items-center gap-2">
				{@render right()}
			</div>
		{/if}
	</div>
</header>
