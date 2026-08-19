<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { enhance } from '$app/forms';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import StatusDot from '$lib/components/server/StatusDot.svelte';
	import { untrack } from 'svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const baseDomain = env.PUBLIC_BASE_DOMAIN ?? 'example.com';
	const address = $derived(`${data.server.subdomain}.${baseDomain}`);

	const tabs = ['Overview', 'Settings', 'Friends', 'World', 'Billing', 'Danger'] as const;
	let tab = $state<(typeof tabs)[number]>('Overview');

	let copied = $state(false);
	async function copyAddress() {
		await navigator.clipboard.writeText(address);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	let deleteOpen = $state(false);
	let deleteConfirm = $state('');

	let pvp = $state(untrack(() => data.server.settings.pvp));
	let allowlistEnabled = $state(untrack(() => data.server.settings.allowlistEnabled));
	let allowlistText = $state(untrack(() => data.server.settings.allowlist.join('\n')));
</script>

<svelte:head>
	<title>{data.server.name} - hosting-mc</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div class="flex items-center gap-3">
		<StatusDot status={data.server.status} />
		<h1 class="text-xl font-bold text-mc-text">{data.server.name}</h1>
		<Badge color={data.server.status === 'running' ? 'green' : data.server.status === 'stopped' ? 'gray' : 'yellow'}>
			{data.server.status}
		</Badge>
	</div>
	<div class="flex items-center gap-2">
		<code class="rounded border border-mc-border bg-mc-surface px-2 py-1 font-mono text-sm text-mc-accent">
			{address}
		</code>
		<Button size="sm" variant="secondary" onclick={copyAddress}>{copied ? 'Copied' : 'Copy'}</Button>
		<form method="POST" action="?/power" use:enhance>
			{#if data.server.status === 'stopped' || data.server.status === 'error'}
				<Button size="sm" type="submit" name="action" value="start">Start</Button>
			{:else if data.server.status === 'running'}
				<Button size="sm" variant="secondary" type="submit" name="action" value="stop">Stop</Button>
			{/if}
		</form>
	</div>
</div>

<nav class="mt-6 flex gap-1 border-b border-mc-border">
	{#each tabs as t (t)}
		<button
			onclick={() => (tab = t)}
			class="border-b-2 px-3 py-2 text-sm transition-colors {tab === t
				? 'border-mc-accent font-medium text-mc-text'
				: 'border-transparent text-mc-muted hover:text-mc-text'}"
		>
			{t}
		</button>
	{/each}
</nav>

<div class="mt-6 max-w-2xl">
	{#if tab === 'Overview'}
		<Card>
			<dl class="space-y-3 text-sm">
				<div class="flex justify-between">
					<dt class="text-mc-muted">Status</dt>
					<dd class="text-mc-text capitalize">{data.server.status}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-mc-muted">Type</dt>
					<dd class="text-mc-text capitalize">{data.server.type}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-mc-muted">Address</dt>
					<dd class="font-mono text-mc-text">{address}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-mc-muted">Game mode</dt>
					<dd class="text-mc-text capitalize">{data.server.settings.gamemode}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-mc-muted">Difficulty</dt>
					<dd class="text-mc-text capitalize">{data.server.settings.difficulty}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-mc-muted">Max players</dt>
					<dd class="text-mc-text">{data.server.settings.maxPlayers}</dd>
				</div>
			</dl>
		</Card>
	{/if}

	{#if tab === 'Settings'}
		<Card>
			<form method="POST" action="?/saveSettings" use:enhance class="flex flex-col gap-5">
				<div class="flex flex-col gap-1.5">
					<label for="difficulty" class="text-sm font-medium text-mc-text">Difficulty</label>
					<select
						id="difficulty"
						name="difficulty"
						class="rounded-lg border border-mc-border bg-mc-bg px-3 py-2 text-sm text-mc-text outline-none focus:border-mc-accent"
					>
						{#each ['peaceful', 'easy', 'normal', 'hard'] as d (d)}
							<option value={d} selected={data.server.settings.difficulty === d} class="capitalize">{d}</option>
						{/each}
					</select>
				</div>

				<Input label="Message of the day" name="motd" value={data.server.settings.motd} maxlength={64} />

				<Toggle label="PvP (players can hurt each other)" name="pvp" bind:checked={pvp} />

				{#if form?.error}
					<p class="text-sm text-red-400">{form.error}</p>
				{/if}
				{#if form?.saved}
					<p class="text-sm text-green-400">Saved</p>
				{/if}
				<div>
					<Button type="submit">Save settings</Button>
				</div>
			</form>
		</Card>
	{/if}

	{#if tab === 'Friends'}
		<Card>
			<p class="text-sm text-mc-muted">
				Only players on this list can join when the allowlist is on. One Minecraft username per line.
			</p>
			<form method="POST" action="?/saveAllowlist" use:enhance class="mt-4 flex flex-col gap-5">
				<Toggle label="Allowlist on" name="allowlistEnabled" bind:checked={allowlistEnabled} />
				<div class="flex flex-col gap-1.5">
					<label for="allowlist" class="text-sm font-medium text-mc-text">Allowed players</label>
					<textarea
						id="allowlist"
						name="allowlist"
						rows="6"
						bind:value={allowlistText}
						placeholder="Notch&#10;Steve"
						class="rounded-lg border border-mc-border bg-mc-bg px-3 py-2 font-mono text-sm text-mc-text outline-none placeholder:text-mc-muted focus:border-mc-accent"
					></textarea>
				</div>
				<div>
					<Button type="submit">Save friends list</Button>
				</div>
			</form>
		</Card>
	{/if}

	{#if tab === 'World'}
		<Card>
			<h3 class="font-semibold text-mc-text">Download your world</h3>
			<p class="mt-1.5 text-sm text-mc-muted">
				Get a full copy of your world as a zip file. Works even while the server is stopped.
			</p>
			<div class="mt-4">
				<a
					href="/servers/{data.server.id}/world.zip"
					class="inline-flex items-center justify-center gap-2 rounded-lg border border-mc-border bg-mc-surface px-4 py-2 text-sm font-medium text-mc-text transition-colors hover:bg-mc-border/50"
				>
					Download world
				</a>
			</div>
		</Card>
	{/if}

	{#if tab === 'Billing'}
		<Card>
			<dl class="space-y-3 text-sm">
				<div class="flex justify-between">
					<dt class="text-mc-muted">Plan</dt>
					<dd class="text-mc-text">Friends</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-mc-muted">Status</dt>
					<dd class="text-mc-text">{data.server.stripeSubscriptionId ? 'Active' : 'Not connected'}</dd>
				</div>
			</dl>
			<p class="mt-4 text-sm text-mc-muted">
				Payment management (card, cancel) opens here once billing is enabled.
			</p>
		</Card>
	{/if}

	{#if tab === 'Danger'}
		<Card class="border-mc-danger/40">
			<h3 class="font-semibold text-mc-text">Delete this server</h3>
			<p class="mt-1.5 text-sm text-mc-muted">
				This stops the server and deletes it. Your world is kept for 7 days, then removed forever.
			</p>
			<div class="mt-4">
				<Button variant="danger" onclick={() => (deleteOpen = true)}>Delete server</Button>
			</div>
		</Card>
	{/if}
</div>

<Dialog bind:open={deleteOpen} title="Delete {data.server.name}?">
	<p class="text-sm text-mc-muted">
		Type <span class="font-mono font-medium text-mc-text">{data.server.name}</span> to confirm.
	</p>
	<Input class="mt-3" bind:value={deleteConfirm} placeholder={data.server.name} />
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (deleteOpen = false)}>Cancel</Button>
		<form method="POST" action="?/delete">
			<Button variant="danger" type="submit" disabled={deleteConfirm !== data.server.name}>Delete</Button>
		</form>
	{/snippet}
</Dialog>
