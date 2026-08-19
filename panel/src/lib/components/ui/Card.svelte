<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children: Snippet;
	};

	let { class: klass = '', children }: Props = $props();
</script>

<div class="rounded-xl border border-mc-border bg-mc-surface p-4 {klass}">
	{@render children()}
</div>
