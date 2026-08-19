<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import StatusDot from '$lib/components/server/StatusDot.svelte';
	import type { servers } from '$lib/server/db/schema';

	type Server = typeof servers.$inferSelect;

	type Props = {
		server: Server;
		address: string;
	};

	let { server, address }: Props = $props();

	let actionLoading = $state(false);

	const statusColor = {
		running: 'green',
		provisioning: 'yellow',
		starting: 'yellow',
		stopping: 'yellow',
		stopped: 'gray',
		error: 'red',
		suspended: 'red'
	} as const;
</script>

<Card>
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-2">
			<StatusDot status={server.status} />
			<button
				onclick={() => goto(`/servers/${server.id}`)}
				class="font-semibold text-mc-text hover:underline"
			>
				{server.name}
			</button>
		</div>
		<Badge color={statusColor[server.status]}>{server.status}</Badge>
	</div>

	<p class="mt-2 font-mono text-sm text-mc-muted">{address}</p>

	<div class="mt-4 flex items-center gap-2">
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
			{#if server.status === 'stopped'}
				<Button size="sm" type="submit" name="action" value="start" loading={actionLoading}>Start</Button>
			{:else if server.status === 'running'}
				<Button size="sm" variant="secondary" type="submit" name="action" value="stop" loading={actionLoading}>
					Stop
				</Button>
			{/if}
		</form>
		<Button size="sm" variant="ghost" onclick={() => goto(`/servers/${server.id}`)}>Manage</Button>
	</div>
</Card>
