<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import PlusIcon from '@lucide/svelte/icons/plus';

	type Props = {
		enabled: boolean;
		friends: string[];
	};

	let { enabled = $bindable(), friends = $bindable() }: Props = $props();

	let input = $state('');
	let error = $state('');
	let checking = $state(false);

	function avatarUrl(name: string) {
		return `https://mc-heads.net/avatar/${name}/32`;
	}

	async function addFriend() {
		const name = input.trim();
		error = '';
		if (!name) return;
		if (friends.some((f) => f.toLowerCase() === name.toLowerCase())) {
			error = 'Already in the list';
			return;
		}
		checking = true;
		try {
			const res = await fetch(`/api/mc-player?name=${encodeURIComponent(name)}`);
			const data = await res.json();
			if (!data.valid) {
				error = data.reason ?? 'Player not found';
				return;
			}
			friends = [...friends, data.name];
			input = '';
		} catch {
			error = 'Could not check the name. Try again.';
		} finally {
			checking = false;
		}
	}

	function removeFriend(name: string) {
		friends = friends.filter((f) => f !== name);
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-3">
		<Switch id="friends-enabled" bind:checked={enabled} />
		<Label for="friends-enabled" class="cursor-pointer">
			Friends only {enabled ? '(on)' : '(off)'}
		</Label>
	</div>
	<input type="checkbox" name="allowlistEnabled" bind:checked={enabled} class="hidden" tabindex="-1" aria-hidden="true" />

	{#each friends as friend (friend)}
		<input type="hidden" name="friend" value={friend} />
	{/each}

	{#if enabled}
		<div class="flex gap-2">
			<Input
				placeholder="Minecraft username"
				bind:value={input}
				maxlength={16}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						addFriend();
					}
				}}
			/>
			<Button type="button" variant="secondary" onclick={addFriend} disabled={checking || !input.trim()}>
				<PlusIcon /> Add
			</Button>
		</div>
		{#if error}
			<p class="text-sm text-destructive">{error}</p>
		{/if}

		{#if friends.length === 0}
			<p class="text-sm text-muted-foreground">No friends added yet. Only you can join.</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each friends as friend (friend)}
					<li class="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
						<img src={avatarUrl(friend)} alt={friend} class="size-8 rounded-md" width="32" height="32" />
						<span class="flex-1 font-mono text-sm text-foreground">{friend}</span>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onclick={() => removeFriend(friend)}
							title="Remove {friend}"
						>
							<XIcon />
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
