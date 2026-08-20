<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { enhance } from '$app/forms';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import FriendsEditor from '$lib/components/server/FriendsEditor.svelte';
	import BlocksIcon from '@lucide/svelte/icons/blocks';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import Gamepad2Icon from '@lucide/svelte/icons/gamepad-2';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import PowerIcon from '@lucide/svelte/icons/power';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import SwordsIcon from '@lucide/svelte/icons/swords';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import { untrack } from 'svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const baseDomain = env.PUBLIC_BASE_DOMAIN ?? 'example.com';
	const address = $derived(`${data.server.subdomain}.${baseDomain}`);

	const typeIcon = {
		survival: SwordsIcon,
		creative: BlocksIcon,
		hardcore: FlameIcon,
		flat: LayersIcon
	};
	const TypeIcon = $derived(typeIcon[data.server.type] ?? SwordsIcon);

	let copied = $state(false);
	async function copyAddress() {
		await navigator.clipboard.writeText(address);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	const running = $derived(data.server.status === 'running');
	const busy = $derived(['provisioning', 'starting', 'stopping'].includes(data.server.status));
	const stopped = $derived(data.server.status === 'stopped' || data.server.status === 'error');

	let deleteOpen = $state(false);
	let deleteConfirm = $state('');

	// --- editable state (dirty -> floating apply bar) ---
	let gamemode = $state(untrack(() => data.server.settings.gamemode));
	let difficulty = $state(untrack(() => data.server.settings.difficulty));
	let motd = $state(untrack(() => data.server.settings.motd));
	let pvp = $state(untrack(() => data.server.settings.pvp));
	let allowlistEnabled = $state(untrack(() => data.server.settings.allowlistEnabled));
	let friends = $state(untrack(() => [...data.server.settings.allowlist]));
	let dirty = $state(false);
	let applying = $state(false);

	function touch() {
		dirty = true;
	}

	function discard() {
		gamemode = data.server.settings.gamemode;
		difficulty = data.server.settings.difficulty;
		motd = data.server.settings.motd;
		pvp = data.server.settings.pvp;
		allowlistEnabled = data.server.settings.allowlistEnabled;
		friends = [...data.server.settings.allowlist];
		dirty = false;
	}

	const statusLabel: Record<string, string> = {
		running: 'Online',
		stopped: 'Offline',
		provisioning: 'Starting',
		starting: 'Starting',
		stopping: 'Stopping',
		error: 'Error',
		suspended: 'Suspended'
	};
	const statusClass: Record<string, string> = {
		running: 'bg-primary/15 text-primary border-transparent',
		stopped: 'bg-muted text-muted-foreground border-transparent',
		provisioning: 'bg-amber-500/15 text-amber-700 border-transparent',
		starting: 'bg-amber-500/15 text-amber-700 border-transparent',
		stopping: 'bg-amber-500/15 text-amber-700 border-transparent',
		error: 'bg-destructive/15 text-destructive border-transparent',
		suspended: 'bg-destructive/15 text-destructive border-transparent'
	};
</script>

<svelte:head>
	<title>{data.server.name} - hosting-mc</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-5">
	<!-- header -->
	<div class="flex flex-wrap items-center gap-3">
		<span class="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm">
			<TypeIcon class="size-7" />
		</span>
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<h1 class="truncate text-xl font-bold text-foreground">{data.server.name}</h1>
				<Badge class={statusClass[data.server.status]}>{statusLabel[data.server.status] ?? data.server.status}</Badge>
			</div>
			<button
				onclick={copyAddress}
				class="mt-0.5 flex items-center gap-1.5 font-mono text-sm text-primary hover:underline"
			>
				{address}
				{#if copied}<CheckIcon class="size-3.5" />{:else}<CopyIcon class="size-3.5" />{/if}
			</button>
		</div>
		<form method="POST" action="?/power" use:enhance>
			{#if stopped}
				<Button type="submit" name="action" value="start" class="rounded-xl">
					<PowerIcon /> Start
				</Button>
			{:else if running}
				<Button type="submit" name="action" value="stop" variant="secondary" class="rounded-xl">
					<PowerIcon /> Stop
				</Button>
			{:else}
				<Button disabled class="rounded-xl">
					<PowerIcon /> Working...
				</Button>
			{/if}
		</form>
	</div>

	<!-- core controls -->
	<Card.Root class="rounded-2xl shadow-sm">
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<PowerIcon class="size-4 text-muted-foreground" /> Core Controls
			</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-3">
			<div class="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
				<span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<ShieldIcon class="size-5" />
				</span>
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-foreground">Friends Only</p>
					<p class="text-xs text-muted-foreground">Only approved players can join</p>
				</div>
				<Switch
					checked={allowlistEnabled}
					aria-label="Friends only"
					onCheckedChange={(v) => {
						allowlistEnabled = v;
						touch();
					}}
				/>
			</div>

			<div class="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
				<span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<SwordsIcon class="size-5" />
				</span>
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-foreground">PvP</p>
					<p class="text-xs text-muted-foreground">Players can hurt each other</p>
				</div>
				<Switch
					checked={pvp}
					aria-label="PvP"
					onCheckedChange={(v) => {
						pvp = v;
						touch();
					}}
				/>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- gameplay -->
	<Card.Root class="rounded-2xl shadow-sm">
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<Gamepad2Icon class="size-4 text-muted-foreground" /> Gameplay
			</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<Label class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Game mode</Label>
				<Select.Root type="single" bind:value={gamemode} onValueChange={touch}>
					<Select.Trigger class="h-11 w-full rounded-xl bg-input capitalize">{gamemode}</Select.Trigger>
					<Select.Content>
						<Select.Item value="survival" class="capitalize">Survival</Select.Item>
						<Select.Item value="creative" class="capitalize">Creative</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			<div class="flex flex-col gap-2">
				<Label class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Difficulty</Label>
				<Select.Root type="single" bind:value={difficulty} onValueChange={touch}>
					<Select.Trigger class="h-11 w-full rounded-xl bg-input capitalize">{difficulty}</Select.Trigger>
					<Select.Content>
						{#each ['peaceful', 'easy', 'normal', 'hard'] as d (d)}
							<Select.Item value={d} class="capitalize">{d}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="flex flex-col gap-2">
				<Label for="motd" class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					Message of the day
				</Label>
				<Input
					id="motd"
					bind:value={motd}
					maxlength={64}
					class="h-11 rounded-xl bg-input"
					oninput={touch}
				/>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- players -->
	<Card.Root class="rounded-2xl shadow-sm">
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<UserPlusIcon class="size-4 text-muted-foreground" /> Players
			</Card.Title>
			<Card.Description>Instantly grant access to a trusted friend.</Card.Description>
		</Card.Header>
		<Card.Content>
			<FriendsEditor bind:friends onchange={touch} />
		</Card.Content>
	</Card.Root>

	<!-- world -->
	<Card.Root class="rounded-2xl shadow-sm">
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<DownloadIcon class="size-4 text-muted-foreground" /> World
			</Card.Title>
			<Card.Description>Download a full copy of your world as a zip, even while stopped.</Card.Description>
		</Card.Header>
		<Card.Content>
			<Button variant="secondary" href="/servers/{data.server.id}/world.zip" class="rounded-xl">
				<DownloadIcon /> Download world
			</Button>
		</Card.Content>
	</Card.Root>

	<!-- billing -->
	<Card.Root class="rounded-2xl shadow-sm">
		<Card.Header>
			<Card.Title class="text-base">Billing</Card.Title>
		</Card.Header>
		<Card.Content>
			<dl class="space-y-2 text-sm">
				<div class="flex justify-between">
					<dt class="text-muted-foreground">Plan</dt>
					<dd class="text-foreground">Friends</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-muted-foreground">Status</dt>
					<dd class="text-foreground">
						{#if !data.billing.enabled}
							Dev mode (no payment)
						{:else if data.server.stripeSubscriptionId}
							Active subscription
						{:else if data.server.status === 'suspended'}
							Suspended - payment needed
						{:else}
							Payment not completed
						{/if}
					</dd>
				</div>
			</dl>
			<div class="mt-4 flex flex-wrap gap-2">
				{#if data.billing.enabled && data.server.stripeSubscriptionId && data.billing.hasCustomer}
					<form method="POST" action="?/portal">
						<Button type="submit" variant="secondary" class="rounded-xl">Manage billing</Button>
					</form>
				{/if}
				{#if data.billing.enabled && !data.server.stripeSubscriptionId}
					<form method="POST" action="?/payNow">
						<Button type="submit" class="rounded-xl">
							{data.server.status === 'suspended' ? 'Reactivate subscription' : 'Complete payment'}
						</Button>
					</form>
				{/if}
			</div>
			{#if data.server.status === 'suspended'}
				<p class="mt-3 text-sm text-muted-foreground">
					Your server is paused. Reactivate to keep playing. The world is deleted 7 days after cancellation.
				</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- danger -->
	<Card.Root class="rounded-2xl border-destructive/40 shadow-sm">
		<Card.Header>
			<Card.Title class="text-base text-destructive">Danger zone</Card.Title>
			<Card.Description>
				This stops the server and deletes it. Your world is kept for 7 days, then removed forever.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<Button variant="destructive" class="rounded-xl" onclick={() => (deleteOpen = true)}>Delete server</Button>
		</Card.Content>
	</Card.Root>
</div>

<!-- floating apply bar -->
{#if dirty}
	<div class="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-2xl md:bottom-6">
		<form
			method="POST"
			action="?/apply"
			use:enhance={() => {
				applying = true;
				return async ({ update }) => {
					applying = false;
					dirty = false;
					await update();
				};
			}}
		>
			<input type="hidden" name="gamemode" value={gamemode} />
			<input type="hidden" name="difficulty" value={difficulty} />
			<input type="hidden" name="motd" value={motd} />
			<input type="checkbox" name="pvp" checked={pvp} class="hidden" tabindex="-1" aria-hidden="true" />
			<input type="checkbox" name="allowlistEnabled" checked={allowlistEnabled} class="hidden" tabindex="-1" aria-hidden="true" />
			{#each friends as friend (friend)}
				<input type="hidden" name="friend" value={friend} />
			{/each}

			<div class="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg">
				<TriangleAlertIcon class="size-5 shrink-0 text-amber-600" />
				<p class="min-w-0 flex-1 text-xs text-muted-foreground sm:text-sm">
					Unsaved changes. Applying restarts the server.
				</p>
				<Button type="button" variant="ghost" size="sm" onclick={discard} disabled={applying}>Discard</Button>
				<Button type="submit" size="sm" class="rounded-lg" disabled={applying}>
					{applying ? 'Applying...' : 'Apply changes'}
				</Button>
			</div>
		</form>
	</div>
{/if}

<Dialog.Root bind:open={deleteOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete {data.server.name}?</Dialog.Title>
			<Dialog.Description>
				Type <span class="font-mono font-medium text-foreground">{data.server.name}</span> to confirm.
			</Dialog.Description>
		</Dialog.Header>
		<Input bind:value={deleteConfirm} placeholder={data.server.name} />
		<Dialog.Footer>
			<Button variant="secondary" onclick={() => (deleteOpen = false)}>Cancel</Button>
			<form method="POST" action="?/delete">
				<Button variant="destructive" type="submit" disabled={deleteConfirm !== data.server.name}>Delete</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
