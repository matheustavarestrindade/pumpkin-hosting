<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const crumbs = $derived.by(() => {
		const parts = page.url.pathname.split('/').filter(Boolean);
		if (parts.length === 0 || parts[0] === 'dashboard') return [{ label: 'Servers' }];
		if (parts[0] === 'servers' && parts[1] === 'new') return [{ label: 'Servers', href: '/dashboard' }, { label: 'New server' }];
		if (parts[0] === 'servers' && parts[1]) {
			return [
				{ label: 'Servers', href: '/dashboard' },
				{ label: page.data.server?.name ?? 'Server' }
			];
		}
		return [{ label: 'Servers' }];
	});
</script>

<Sidebar.Provider>
	<AppSidebar user={data.user} />
	<Sidebar.Inset>
		<header class="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
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
		<main class="flex-1 p-4 sm:p-6">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
