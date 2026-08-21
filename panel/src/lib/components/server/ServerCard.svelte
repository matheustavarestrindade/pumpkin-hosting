<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { goto } from '$app/navigation';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { cn } from '$lib/utils';
	import BlocksIcon from '@lucide/svelte/icons/blocks';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import SwordsIcon from '@lucide/svelte/icons/swords';
	import UsersIcon from '@lucide/svelte/icons/users';
	import type { servers } from '$lib/server/db/schema';

	type Server = typeof servers.$inferSelect;

	type Props = {
		server: Server & { containerStatus?: string | null; players?: { online: number; max: number } | null };
		address: string;
	};

	let { server, address }: Props = $props();

	const typeIcon = {
		survival: SwordsIcon,
		creative: BlocksIcon,
		hardcore: FlameIcon,
		flat: LayersIcon
	};

	const statusLabel: Record<string, () => string> = {
		running: m.status_running,
		sleeping: m.status_sleeping,
		stopped: m.status_stopped,
		provisioning: m.status_provisioning,
		starting: m.status_starting,
		stopping: m.status_stopping,
		error: m.status_error,
		suspended: m.status_suspended
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

	const displayStatus = $derived(
		server.status === 'running' && server.containerStatus === 'stopped' ? 'sleeping' : server.status
	);

	const Icon = $derived(typeIcon[server.type] ?? SwordsIcon);
</script>

<button
	onclick={() => goto(`/servers/${server.id}`)}
	class="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40"
>
	<span class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
		<Icon class="size-6" />
	</span>

	<span class="min-w-0 flex-1">
		<span class="block truncate font-semibold text-foreground">{server.name}</span>
		<span class="mt-0.5 block truncate text-sm text-muted-foreground">
			<span class="capitalize">{server.type}</span> · {address}
		</span>
		<span class="mt-1.5 inline-flex items-center gap-1.5">
			<Badge class={cn('px-2 py-0.5 text-xs', statusClass[displayStatus])}>
				{statusLabel[displayStatus]?.() ?? displayStatus}
			</Badge>
			{#if server.players}
				<Badge variant="secondary" class="gap-1 px-2 py-0.5 text-xs">
					<UsersIcon class="size-3" /> {server.players.online}/{server.players.max}
				</Badge>
			{/if}
		</span>
	</span>

	<ChevronRightIcon class="size-5 shrink-0 text-muted-foreground" />
</button>
