<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import BottomTabs from '$lib/components/bottom-tabs.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const crumbs = $derived.by(() => {
		const parts = page.url.pathname.split('/').filter(Boolean);
		if (parts.length === 0 || parts[0] === 'dashboard') return [{ label: 'Servers' }];
		if (parts[0] === 'servers' && parts[1] === 'new')
			return [{ label: 'Servers', href: '/dashboard' }, { label: 'New server' }];
		if (parts[0] === 'servers' && parts[1]) {
			return [
				{ label: 'Servers', href: '/dashboard' },
				{ label: page.data.server?.name ?? 'Server' }
			];
		}
		if (parts[0] === 'settings') return [{ label: 'Profile' }];
		return [{ label: 'Servers' }];
	});
</script>

<Sidebar.Provider>
	<AppSidebar user={data.user} isAdmin={data.isAdmin} />
	<Sidebar.Inset>
		<!-- mobile top bar -->
		<header class="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:hidden">
			<a href="/dashboard" class="flex items-center gap-2 font-semibold text-foreground">
				<span class="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">H</span>
				hosting-mc
			</a>
			<a
				href="/settings"
				class="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
			>
				{data.user.name.slice(0, 2).toUpperCase()}
			</a>
		</header>

		<!-- desktop header -->
		<header class="hidden h-14 shrink-0 items-center gap-2 border-b border-border px-4 md:flex">
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4" />
			<Breadcrumb.Root>
				<Breadcrumb.List>
					{#each crumbs as crumb, i (crumb.label)}
						{#if i > 0}
							<Breadcrumb.Separator />
						{/if}
						<Breadcrumb.Item>
							{#if crumb.href}
								<Breadcrumb.Link href={crumb.href}>{crumb.label}</Breadcrumb.Link>
							{:else}
								<Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
							{/if}
						</Breadcrumb.Item>
					{/each}
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</header>

		<main class="flex-1 p-4 pb-24 sm:p-6 md:pb-6">
			{@render children()}
		</main>

		<BottomTabs />
	</Sidebar.Inset>
</Sidebar.Provider>
