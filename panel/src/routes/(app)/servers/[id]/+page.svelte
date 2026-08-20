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
	import * as Tabs from '$lib/components/ui/tabs';
	import StatusDot from '$lib/components/server/StatusDot.svelte';
	import FriendsEditor from '$lib/components/server/FriendsEditor.svelte';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { untrack } from 'svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const baseDomain = env.PUBLIC_BASE_DOMAIN ?? 'example.com';
	const address = $derived(`${data.server.subdomain}.${baseDomain}`);

	let tab = $state('overview');

	let copied = $state(false);
	async function copyAddress() {
		await navigator.clipboard.writeText(address);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	let deleteOpen = $state(false);
	let deleteConfirm = $state('');

	let difficulty = $state(untrack(() => data.server.settings.difficulty));
	let pvp = $state(untrack(() => data.server.settings.pvp));
	let allowlistEnabled = $state(untrack(() => data.server.settings.allowlistEnabled));
	let friends = $state(untrack(() => [...data.server.settings.allowlist]));

	const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		running: 'default',
		provisioning: 'secondary',
		starting: 'secondary',
		stopping: 'secondary',
		stopped: 'outline',
		error: 'destructive',
		suspended: 'destructive'
	};
</script>

<svelte:head>
	<title>{data.server.name} - hosting-mc</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div class="flex min-w-0 items-center gap-3">
		<StatusDot status={data.server.status} />
		<h1 class="truncate text-xl font-bold text-foreground">{data.server.name}</h1>
		<Badge variant={statusVariant[data.server.status] ?? 'outline'}>{data.server.status}</Badge>
	</div>
	<div class="flex items-center gap-2">
		<code class="rounded-md border border-border bg-card px-2 py-1.5 font-mono text-sm text-primary">
			{address}
		</code>
		<Button variant="outline" size="icon" onclick={copyAddress} title="Copy address">
			{#if copied}<CheckIcon class="text-primary" />{:else}<CopyIcon />{/if}
		</Button>
		<form method="POST" action="?/power" use:enhance>
			{#if data.server.status === 'stopped' || data.server.status === 'error'}
				<Button type="submit" name="action" value="start">Start</Button>
			{:else if data.server.status === 'running'}
				<Button variant="secondary" type="submit" name="action" value="stop">Stop</Button>
			{/if}
		</form>
	</div>
</div>

<Tabs.Root bind:value={tab} class="mt-6">
	<Tabs.List class="w-full justify-start overflow-x-auto">
		<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
		<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
		<Tabs.Trigger value="friends">Friends</Tabs.Trigger>
		<Tabs.Trigger value="world">World</Tabs.Trigger>
		<Tabs.Trigger value="billing">Billing</Tabs.Trigger>
		<Tabs.Trigger value="danger">Danger</Tabs.Trigger>
	</Tabs.List>

	<div class="mt-6 max-w-2xl">
		<Tabs.Content value="overview">
			<Card.Root>
				<Card.Content class="pt-6">
					<dl class="space-y-3 text-sm">
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Status</dt>
							<dd class="capitalize text-foreground">{data.server.status}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Type</dt>
							<dd class="capitalize text-foreground">{data.server.type}</dd>
						</div>
						<div class="flex justify-between gap-2">
							<dt class="text-muted-foreground">Address</dt>
							<dd class="truncate font-mono text-foreground">{address}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Game mode</dt>
							<dd class="capitalize text-foreground">{data.server.settings.gamemode}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Difficulty</dt>
							<dd class="capitalize text-foreground">{data.server.settings.difficulty}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Max players</dt>
							<dd class="text-foreground">{data.server.settings.maxPlayers}</dd>
						</div>
					</dl>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="settings">
			<Card.Root>
				<Card.Content class="pt-6">
					<form method="POST" action="?/saveSettings" use:enhance class="flex flex-col gap-5">
						<div class="flex flex-col gap-2">
							<Label>Difficulty</Label>
							<Select.Root type="single" name="difficulty" bind:value={difficulty}>
								<Select.Trigger class="w-full capitalize">{difficulty}</Select.Trigger>
								<Select.Content>
									{#each ['peaceful', 'easy', 'normal', 'hard'] as d (d)}
										<Select.Item value={d} class="capitalize">{d}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<div class="flex flex-col gap-2">
							<Label for="motd">Message of the day</Label>
							<Input id="motd" name="motd" value={data.server.settings.motd} maxlength={64} />
						</div>

						<div class="flex items-center gap-3">
							<Switch id="pvp" bind:checked={pvp} />
							<Label for="pvp" class="cursor-pointer">PvP (players can hurt each other)</Label>
							<input type="checkbox" name="pvp" bind:checked={pvp} class="hidden" tabindex="-1" aria-hidden="true" />
						</div>

						{#if form?.error}
							<p class="text-sm text-destructive">{form.error}</p>
						{/if}
						{#if form?.saved}
							<p class="text-sm text-primary">Saved</p>
						{/if}
						<div>
							<Button type="submit">Save settings</Button>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="friends">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Friends list</Card.Title>
					<Card.Description>Only these players can join when the friends list is on.</Card.Description>
				</Card.Header>
				<Card.Content>
					<form method="POST" action="?/saveAllowlist" use:enhance class="flex flex-col gap-5">
						<FriendsEditor bind:enabled={allowlistEnabled} bind:friends />
						<div>
							<Button type="submit">Save friends</Button>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="world">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Download your world</Card.Title>
					<Card.Description>
						Get a full copy of your world as a zip file. Works even while the server is stopped.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<Button variant="secondary" href="/servers/{data.server.id}/world.zip">Download world</Button>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="billing">
			<Card.Root>
				<Card.Content class="pt-6">
					<dl class="space-y-3 text-sm">
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Plan</dt>
							<dd class="text-foreground">Friends</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Billing</dt>
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
					<div class="mt-4 flex gap-2">
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
							Your server is paused. Reactivate to keep playing. The world is deleted 7 days after
							cancellation.
						</p>
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="danger">
			<Card.Root class="border-destructive/40">
				<Card.Header>
					<Card.Title class="text-base">Delete this server</Card.Title>
					<Card.Description>
						This stops the server and deletes it. Your world is kept for 7 days, then removed forever.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<Button variant="destructive" onclick={() => (deleteOpen = true)}>Delete server</Button>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</div>
</Tabs.Root>

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
