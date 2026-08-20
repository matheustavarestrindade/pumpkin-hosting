<script lang="ts">
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';
	import { cn } from '$lib/utils';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import UserIcon from '@lucide/svelte/icons/user';

	const tabs = $derived([
		{ label: m.nav_dashboard(), href: '/dashboard', icon: LayoutGridIcon },
		{ label: m.nav_create(), href: '/servers/new', icon: PlusIcon },
		{ label: m.nav_profile(), href: '/settings', icon: UserIcon }
	]);

	function isActive(href: string) {
		if (href === '/dashboard') return page.url.pathname === '/dashboard';
		return page.url.pathname.startsWith(href);
	}
</script>

<nav class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
	<div class="grid grid-cols-3">
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				class={cn(
					'flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
					isActive(tab.href) ? 'text-primary' : 'text-muted-foreground'
				)}
			>
				<tab.icon class="size-5" />
				{tab.label}
			</a>
		{/each}
	</div>
</nav>
