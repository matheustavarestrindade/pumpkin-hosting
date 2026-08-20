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
		'group overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-all',
		selected ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-primary/40'
	)}
>
	<img src={image} alt={name} class="aspect-[4/3] w-full object-cover" />
	<div class="p-3">
		<p class="font-semibold text-foreground">{name}</p>
		<p class="mt-0.5 text-xs text-muted-foreground">{description}</p>
	</div>
</button>
