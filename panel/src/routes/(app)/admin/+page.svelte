<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import * as Card from '$lib/components/ui/card';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import ServerIcon from '@lucide/svelte/icons/server';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function timeAgo(date: Date | string | null) {
		if (!date) return 'never';
		const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
		if (seconds < 60) return `${seconds}s ago`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		return `${Math.floor(seconds / 86400)}d ago`;
	}

	const nodeHealthy = (lastSeenAt: Date | string | null) =>
		lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < 2 * 60 * 1000;
</script>

<svelte:head>
	<title>{m.nav_admin()} - hosting-mc</title>
</svelte:head>

<div class="mx-auto flex max-w-4xl flex-col gap-6">
	<h1 class="text-2xl font-bold text-foreground">{m.admin_title()}</h1>

	<div class="grid grid-cols-3 gap-3">
		<Card.Root>
			<Card.Content class="flex items-center gap-3 pt-4">
				<span class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<ServerIcon class="size-5" />
				</span>
				<span>
					<span class="block text-2xl font-bold text-foreground">{data.stats.totalServers}</span>
					<span class="text-xs text-muted-foreground">{m.admin_stats_servers()}</span>
				</span>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="flex items-center gap-3 pt-4">
				<span class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<ActivityIcon class="size-5" />
				</span>
				<span>
					<span class="block text-2xl font-bold text-foreground">{data.stats.runningServers}</span>
					<span class="text-xs text-muted-foreground">{m.admin_stats_running()}</span>
				</span>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="flex items-center gap-3 pt-4">
				<span class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<UsersIcon class="size-5" />
				</span>
				<span>
					<span class="block text-2xl font-bold text-foreground">{data.stats.totalUsers}</span>
					<span class="text-xs text-muted-foreground">{m.admin_stats_users()}</span>
				</span>
			</Card.Content>
		</Card.Root>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">{m.admin_nodes()}</Card.Title>
			<Card.Description>{m.admin_nodes_sub()}</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-2">
			{#each data.nodes as node (node.id)}
				{@const healthy = nodeHealthy(node.lastSeenAt)}
				<div class="flex items-center gap-3 rounded-xl border border-border p-3">
					<span class="size-2.5 shrink-0 rounded-full {healthy ? 'bg-primary' : 'bg-destructive'}"></span>
					<span class="min-w-0 flex-1">
						<span class="block text-sm font-medium text-foreground">{node.name}</span>
						<span class="block font-mono text-xs text-muted-foreground">{node.apiUrl}</span>
					</span>
					<span class="text-xs text-muted-foreground">
						{healthy ? m.admin_nodes_healthy() : m.admin_nodes_last_seen({ ago: timeAgo(node.lastSeenAt) })}
					</span>
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">{m.admin_nodes_none()}</p>
			{/each}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">{m.admin_servers()}</Card.Title>
			<Card.Description>{m.admin_servers_sub()}</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-2">
			{#each data.servers as server (server.id)}
				<a href="/servers/{server.id}" class="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50">
					<span class="min-w-0 flex-1">
						<span class="block truncate text-sm font-medium text-foreground">{server.name}</span>
						<span class="block text-xs text-muted-foreground">{server.ownerEmail}</span>
					</span>
					<span class="hidden font-mono text-xs text-muted-foreground sm:block">{server.subdomain}</span>
					<Badge class="bg-muted text-muted-foreground">{server.status}</Badge>
				</a>
			{:else}
				<p class="text-sm text-muted-foreground">{m.admin_servers_none()}</p>
			{/each}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">{m.admin_users()}</Card.Title>
			<Card.Description>{m.admin_users_sub()}</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-2">
			{#each data.users as u (u.id)}
				<div class="flex items-center gap-3 rounded-xl border border-border p-3">
					<span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
						{(u.name || u.email).slice(0, 2).toUpperCase()}
					</span>
					<span class="min-w-0 flex-1">
						<span class="block truncate text-sm font-medium text-foreground">{u.name}</span>
						<span class="block truncate text-xs text-muted-foreground">{u.email}</span>
					</span>
					<span class="text-xs text-muted-foreground">{m.admin_users_servers({ count: u.serverCount })}</span>
				</div>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
