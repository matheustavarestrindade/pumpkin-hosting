<script lang="ts">
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
			error = err.message ?? 'Could not change password';
			return;
		}
		message = 'Password changed';
		currentPassword = '';
		newPassword = '';
	}

	async function logout() {
		await authClient.signOut();
		goto('/');
	}
</script>

<svelte:head>
	<title>Profile - hosting-mc</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-5">
	<h1 class="text-2xl font-bold text-foreground">Profile</h1>

	<Card.Root class="rounded-2xl shadow-sm">
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<UserIcon class="size-4 text-muted-foreground" /> Account
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

	<Card.Root class="rounded-2xl shadow-sm">
		<Card.Header>
			<Card.Title class="text-base">Change password</Card.Title>
		</Card.Header>
		<Card.Content>
			<form onsubmit={changePassword} class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Label for="current">Current password</Label>
					<Input
						id="current"
						type="password"
						bind:value={currentPassword}
						required
						autocomplete="current-password"
						class="h-11 rounded-xl bg-input"
					/>
				</div>
				<div class="flex flex-col gap-2">
					<Label for="new">New password</Label>
					<Input
						id="new"
						type="password"
						bind:value={newPassword}
						required
						minlength={8}
						autocomplete="new-password"
						class="h-11 rounded-xl bg-input"
					/>
				</div>
				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}
				{#if message}
					<p class="text-sm font-medium text-primary">{message}</p>
				{/if}
				<div class="flex gap-2">
					<Button type="submit" class="rounded-xl" disabled={loading}>
						{loading ? 'Saving...' : 'Change password'}
					</Button>
					<Button type="button" variant="secondary" class="rounded-xl" onclick={logout}>
						<LogOutIcon /> Log out
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
