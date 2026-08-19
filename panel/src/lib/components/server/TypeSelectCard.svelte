<script lang="ts">
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
	class="overflow-hidden rounded-xl border text-left transition-colors {selected
		? 'border-mc-accent ring-1 ring-mc-accent'
		: 'border-mc-border hover:border-mc-muted'}"
>
	<img src={image} alt={name} class="aspect-[2/1] w-full object-cover" />
	<div class="bg-mc-surface p-3">
		<p class="font-semibold text-mc-text">{name}</p>
		<p class="mt-0.5 text-sm text-mc-muted">{description}</p>
	</div>
</button>
