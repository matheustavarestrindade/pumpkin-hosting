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
	import FriendsEditor from '$lib/components/server/FriendsEditor.svelte';
	import BlocksIcon from '@lucide/svelte/icons/blocks';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import Gamepad2Icon from '@lucide/svelte/icons/gamepad-2';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
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

	let deleteOpen = $state(false);
	let deleteConfirm = $state('');
	let powerBusy = $state(false);

	// --- editable state (diff from snapshot -> floating apply bar) ---
	let gamemode = $state(untrack(() => data.server.settings.gamemode));
	let difficulty = $state(untrack(() => data.server.settings.difficulty));
	let motd = $state(untrack(() => data.server.settings.motd));
	let pvp = $state(untrack(() => data.server.settings.pvp));
	let allowlistEnabled = $state(untrack(() => data.server.settings.allowlistEnabled));
	let friends = $state(untrack(() => [...data.server.settings.allowlist]));
	let applying = $state(false);
	let appliedFlash = $state(false);

	const snapshot = $derived(
		JSON.stringify({
			gamemode: data.server.settings.gamemode,
			difficulty: data.server.settings.difficulty,
			motd: data.server.settings.motd,
			pvp: data.server.settings.pvp,
			allowlistEnabled: data.server.settings.allowlistEnabled,
			friends: data.server.settings.allowlist
		})
	);
	const dirty = $derived(
		JSON.stringify({ gamemode, difficulty, motd, pvp, allowlistEnabled, friends }) !== snapshot
	);

	function discard() {
		gamemode = data.server.settings.gamemode;
		difficulty = data.server.settings.difficulty;
		motd = data.server.settings.motd;
		pvp = data.server.settings.pvp;
		allowlistEnabled = data.server.settings.allowlistEnabled;
		friends = [...data.server.settings.allowlist];
	}

	const statusLabel: Record<string, string> = {
		running: 'Online',
		sleeping: 'Sleeping',
		stopped: 'Offline',
		provisioning: 'Waiting payment',
		starting: 'Starting',
		stopping: 'Stopping',
		error: 'Error',
		suspended: 'Suspended'
	};
	const statusClass: Record<string, string> = {
		running: 'bg-primary/15 text-primary border-transparent',
		sleeping: 'bg-sky-500/15 text-sky-700 border-transparent',
		stopped: 'bg-muted text-muted-foreground border-transparent',
		provisioning: 'bg-amber-500/15 text-amber-700 border-transparent',
		starting: 'bg-amber-500/15 text-amber-700 border-transparent',
		stopping: 'bg-amber-500/15 text-amber-700 border-transparent',
		error: 'bg-destructive/15 text-destructive border-transparent',
		suspended: 'bg-destructive/15 text-destructive border-transparent'
	};

	// DB says running but the container is stopped = auto-sleeping.
	const displayStatus = $derived(
		data.server.status === 'running' && data.containerStatus === 'stopped'
			? 'sleeping'
			: data.server.status
	);
	const running = $derived(data.server.status === 'running');
	const sleeping = $derived(displayStatus === 'sleeping');
	const busy = $derived(['provisioning', 'starting', 'stopping'].includes(data.server.status));
	const stopped = $derived(data.server.status === 'stopped' || data.server.status === 'error');
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
				<Badge class={statusClass[displayStatus]}>{statusLabel[displayStatus] ?? displayStatus}</Badge>
			</div>
			<button
				onclick={copyAddress}
				class="mt-0.5 flex items-center gap-1.5 font-mono text-sm text-primary hover:underline"
			>
				{address}
				{#if copied}<CheckIcon class="size-3.5" />{:else}<CopyIcon class="size-3.5" />{/if}
			</button>
		</div>
	</div>

	<!-- core controls -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<PowerIcon class="size-4 text-muted-foreground" /> Core Controls
			</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-3">
			<form
				method="POST"
				action="?/power"
				use:enhance={() => {
					powerBusy = true;
					return async ({ update }) => {
						powerBusy = false;
						await update();
					};
				}}
			>
				<button
					type="submit"
					name="action"
					value={running ? 'stop' : 'start'}
					disabled={busy || powerBusy}
					class="relative flex w-full items-center gap-3 rounded-xl border p-3 pr-16 text-left transition-colors disabled:cursor-wait {sleeping
						? 'border-sky-500/40 bg-sky-500/10'
						: running
							? 'border-primary/40 bg-primary/10'
							: 'border-destructive/40 bg-destructive/10'}"
				>
					<Badge
						class="absolute top-3 right-3 border-transparent {sleeping
							? 'bg-sky-500 text-white'
							: running
								? 'bg-primary text-primary-foreground'
								: 'bg-destructive text-destructive-foreground'}"
					>
						{statusLabel[displayStatus] ?? displayStatus}
					</Badge>
					<span
						class="flex size-10 shrink-0 items-center justify-center rounded-lg {sleeping
							? 'bg-sky-500/15 text-sky-700'
							: running
								? 'bg-primary/15 text-primary'
								: 'bg-destructive/15 text-destructive'}"
					>
						{#if busy || powerBusy}
							<LoaderCircleIcon class="size-5 animate-spin" />
						{:else}
							<PowerIcon class="size-5" />
						{/if}
					</span>
					<span class="min-w-0 flex-1">
						<span class="block text-sm font-medium text-foreground">Server Status</span>
						<span class="block text-xs text-muted-foreground">
							{#if powerBusy}
								{running ? 'Stopping...' : 'Starting...'}
							{:else if busy}
								{statusLabel[displayStatus]}...
							{:else if sleeping}
								Asleep - wakes automatically when a player joins. Click to stop.
							{:else if running}
								Players can join - click to stop
							{:else}
								Players cannot join - click to start
							{/if}
						</span>
					</span>
				</button>
			</form>

			<button
				type="button"
				onclick={() => (allowlistEnabled = !allowlistEnabled)}
				class="relative flex w-full items-center gap-3 rounded-xl border p-3 pr-16 text-left transition-colors {allowlistEnabled
					? 'border-primary/40 bg-primary/10'
					: 'border-destructive/40 bg-destructive/10'}"
			>
				<Badge class="absolute top-3 right-3 border-transparent {allowlistEnabled ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}">
					{allowlistEnabled ? 'On' : 'Off'}
				</Badge>
				<span class="flex size-10 shrink-0 items-center justify-center rounded-lg {allowlistEnabled ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}">
					<ShieldIcon class="size-5" />
				</span>
				<span class="min-w-0 flex-1">
					<span class="block text-sm font-medium text-foreground">Friends Only</span>
					<span class="block text-xs text-muted-foreground">Only approved players can join</span>
				</span>
			</button>

			<button
				type="button"
				onclick={() => (pvp = !pvp)}
				class="relative flex w-full items-center gap-3 rounded-xl border p-3 pr-16 text-left transition-colors {pvp
					? 'border-primary/40 bg-primary/10'
					: 'border-destructive/40 bg-destructive/10'}"
			>
				<Badge class="absolute top-3 right-3 border-transparent {pvp ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}">
					{pvp ? 'On' : 'Off'}
				</Badge>
				<span class="flex size-10 shrink-0 items-center justify-center rounded-lg {pvp ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}">
					<SwordsIcon class="size-5" />
				</span>
				<span class="min-w-0 flex-1">
					<span class="block text-sm font-medium text-foreground">PvP</span>
					<span class="block text-xs text-muted-foreground">Players can hurt each other</span>
				</span>
			</button>
		</Card.Content>
	</Card.Root>

	<!-- gameplay -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<Gamepad2Icon class="size-4 text-muted-foreground" /> Gameplay
			</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<Label class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Game mode</Label>
				<Select.Root type="single" bind:value={gamemode}>
					<Select.Trigger class="capitalize">{gamemode}</Select.Trigger>
					<Select.Content>
						<Select.Item value="survival" class="capitalize">Survival</Select.Item>
						<Select.Item value="creative" class="capitalize">Creative</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			<div class="flex flex-col gap-2">
				<Label class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Difficulty</Label>
				<Select.Root type="single" bind:value={difficulty}>
					<Select.Trigger class="capitalize">{difficulty}</Select.Trigger>
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
				/>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- players -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<UserPlusIcon class="size-4 text-muted-foreground" /> Players
			</Card.Title>
			<Card.Description>Instantly grant access to a trusted friend.</Card.Description>
		</Card.Header>
		<Card.Content>
			<FriendsEditor bind:friends />
		</Card.Content>
	</Card.Root>

	<!-- world -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<DownloadIcon class="size-4 text-muted-foreground" /> World
			</Card.Title>
			<Card.Description>Download a full copy of your world as a zip, even while stopped.</Card.Description>
		</Card.Header>
		<Card.Content>
			<Button variant="secondary" href="/servers/{data.server.id}/world.zip">
				<DownloadIcon /> Download world
			</Button>
		</Card.Content>
	</Card.Root>

	<!-- billing -->
	<Card.Root>
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
						<Button type="submit" variant="secondary">Manage billing</Button>
					</form>
				{/if}
				{#if data.billing.enabled && !data.server.stripeSubscriptionId}
					<form method="POST" action="?/payNow">
						<Button type="submit">
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
			<Button variant="destructive" onclick={() => (deleteOpen = true)}>Delete server</Button>
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
					appliedFlash = true;
					setTimeout(() => (appliedFlash = false), 4000);
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

<!-- applied feedback -->
{#if appliedFlash && !dirty}
	<div class="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-2xl md:bottom-6">
		<div class="flex items-center gap-3 rounded-2xl border border-primary/40 bg-card p-3 shadow-lg">
			<CheckIcon class="size-5 shrink-0 text-primary" />
			<p class="flex-1 text-sm text-foreground">
				Changes applied{running ? ' - the server is restarting.' : '.'}
			</p>
		</div>
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
