<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import StatusDot from '$lib/components/server/StatusDot.svelte';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import type { servers } from '$lib/server/db/schema';

	type Server = typeof servers.$inferSelect;

	type Props = {
		server: Server;
		address: string;
	};

	let { server, address }: Props = $props();

	let actionLoading = $state(false);
	let copied = $state(false);

	async function copyAddress() {
		await navigator.clipboard.writeText(address);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

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

<Card.Root class="transition-colors hover:border-foreground/20">
	<Card.Header class="pb-3">
		<div class="flex items-start justify-between gap-2">
			<div class="flex items-center gap-2 min-w-0">
				<StatusDot status={server.status} />
				<button
					onclick={() => goto(`/servers/${server.id}`)}
					class="truncate font-semibold text-foreground hover:underline"
				>
					{server.name}
				</button>
			</div>
			<Badge variant={statusVariant[server.status] ?? 'outline'}>{server.status}</Badge>
		</div>
	</Card.Header>
	<Card.Content class="pb-3">
		<div class="flex items-center gap-1">
			<code class="min-w-0 truncate rounded-md border border-border bg-background px-2 py-1 font-mono text-sm text-primary">
				{address}
			</code>
			<Button variant="ghost" size="icon-sm" onclick={copyAddress} title="Copy address">
				{#if copied}<CheckIcon class="text-primary" />{:else}<CopyIcon />{/if}
			</Button>
		</div>
	</Card.Content>
	<Card.Footer class="gap-2">
		<form
			method="POST"
			action="/servers/{server.id}?/power"
			use:enhance={() => {
				actionLoading = true;
				return async ({ update }) => {
					actionLoading = false;
					await update();
				};
			}}
		>
			{#if server.status === 'stopped' || server.status === 'error'}
				<Button size="sm" type="submit" name="action" value="start" disabled={actionLoading}>Start</Button>
			{:else if server.status === 'running'}
				<Button size="sm" variant="secondary" type="submit" name="action" value="stop" disabled={actionLoading}>
					Stop
				</Button>
			{/if}
		</form>
		<Button size="sm" variant="ghost" href="/servers/{server.id}">Manage</Button>
	</Card.Footer>
</Card.Root>
