<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		color?: 'green' | 'yellow' | 'red' | 'gray' | 'blue';
		children: Snippet;
	};

	let { color = 'gray', children }: Props = $props();

	const colors = {
		green: 'bg-green-500/10 text-green-400 border-green-500/20',
		yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
		red: 'bg-red-500/10 text-red-400 border-red-500/20',
		gray: 'bg-mc-muted/10 text-mc-muted border-mc-border',
		blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
	};
</script>

<span
	class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium {colors[color]}"
>
	{@render children()}
</span>
