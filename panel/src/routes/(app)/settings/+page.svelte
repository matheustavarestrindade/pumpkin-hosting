<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import UserIcon from '@lucide/svelte/icons/user';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let currentPassword = $state('');
	let newPassword = $state('');
	let message = $state('');
	let error = $state('');
	let loading = $state(false);

	async function changePassword(e: SubmitEvent) {
		e.preventDefault();
		message = '';
		error = '';
		loading = true;
		const { error: err } = await authClient.changePassword({
			currentPassword,
			newPassword,
			revokeOtherSessions: true
		});
		loading = false;
		if (err) {
			error = err.message ?? m.settings_password_error();
			return;
		}
		message = m.settings_password_done();
		currentPassword = '';
		newPassword = '';
	}

	async function logout() {
		await authClient.signOut();
		goto('/');
	}
</script>

<svelte:head>
	<title>{m.settings_title()} - hosting-mc</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-5">
	<h1 class="text-2xl font-bold text-foreground">{m.settings_title()}</h1>

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<UserIcon class="size-4 text-muted-foreground" /> {m.settings_account()}
			</Card.Title>
		</Card.Header>
		<Card.Content class="flex items-center gap-3">
			<span class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
				{data.user.name.slice(0, 2).toUpperCase()}
			</span>
			<div class="min-w-0">
				<p class="truncate font-semibold text-foreground">{data.user.name}</p>
				<p class="truncate text-sm text-muted-foreground">{data.user.email}</p>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">{m.settings_password()}</Card.Title>
		</Card.Header>
		<Card.Content>
			<form onsubmit={changePassword} class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Label for="current">{m.settings_password_current()}</Label>
					<Input
						id="current"
						type="password"
						bind:value={currentPassword}
						required
						autocomplete="current-password"
					/>
				</div>
				<div class="flex flex-col gap-2">
					<Label for="new">{m.settings_password_new()}</Label>
					<Input
						id="new"
						type="password"
						bind:value={newPassword}
						required
						minlength={8}
						autocomplete="new-password"
					/>
				</div>
				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}
				{#if message}
					<p class="text-sm font-medium text-primary">{message}</p>
				{/if}
				<div class="flex gap-2">
					<Button type="submit" disabled={loading}>
						{loading ? m.settings_saving() : m.settings_password_button()}
					</Button>
					<Button type="button" variant="secondary" onclick={logout}>
						<LogOutIcon /> {m.nav_logout()}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
