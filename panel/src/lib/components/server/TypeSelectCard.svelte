<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		name: string;
		description: string;
		image: string;
		selected?: boolean;
		onselect: () => void;
	};

	let { name, description, image, selected = false, onselect }: Props = $props();
</script>

<button
	type="button"
	onclick={onselect}
	class={cn(
		'overflow-hidden rounded-xl border text-left transition-colors',
		selected
			? 'border-primary ring-1 ring-primary'
			: 'border-border hover:border-foreground/30'
	)}
>
	<img src={image} alt={name} class="aspect-[2/1] w-full object-cover" />
	<div class="bg-card p-3">
		<p class="font-semibold text-foreground">{name}</p>
		<p class="mt-0.5 text-sm text-muted-foreground">{description}</p>
	</div>
</button>
