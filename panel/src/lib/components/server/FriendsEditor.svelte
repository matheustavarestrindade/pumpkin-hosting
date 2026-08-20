<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';

	type Props = {
		friends: string[];
	};

	let { friends = $bindable() }: Props = $props();

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

<div class="flex flex-col gap-3">
	<div class="flex gap-2">
		<Input
			placeholder="Minecraft username"
			bind:value={input}
			maxlength={16}
			class="h-11 rounded-xl bg-input"
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					addFriend();
				}
			}}
		/>
		<Button
			type="button"
			size="icon-lg"
			onclick={addFriend}
			disabled={checking || !input.trim()}
			aria-label="Add player"
		>
			<PlusIcon />
		</Button>
	</div>
	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}

	{#each friends as friend (friend)}
		<input type="hidden" name="friend" value={friend} />
	{/each}

	{#if friends.length === 0}
		<p class="text-sm text-muted-foreground">No players added yet.</p>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each friends as friend (friend)}
				<li class="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2">
					<img src={avatarUrl(friend)} alt={friend} class="size-8 rounded-lg" width="32" height="32" />
					<span class="flex-1 font-mono text-sm text-foreground">{friend}</span>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onclick={() => removeFriend(friend)}
						aria-label="Remove {friend}"
					>
						<XIcon />
					</Button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
