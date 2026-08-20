<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import BlocksIcon from '@lucide/svelte/icons/blocks';

	const token = $derived(page.url.searchParams.get('token') ?? '');

	let password = $state('');
	let confirm = $state('');
	let loading = $state(false);
	let error = $state('');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (password.length < 8) {
			error = m.auth_reset_error_short();
			return;
		}
		if (password !== confirm) {
			error = m.auth_reset_error_mismatch();
			return;
		}
		loading = true;
		const res = await authClient.resetPassword({ newPassword: password, token });
		loading = false;
		if (res.error) {
			error = res.error.message ?? m.auth_reset_error_failed();
			return;
		}
		goto('/login');
	}
</script>

<svelte:head>
	<title>{m.auth_reset_title()} - hosting-mc</title>
</svelte:head>

<div class="flex min-h-dvh items-center justify-center p-4">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="items-center text-center">
			<span class="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
				<BlocksIcon class="size-5" />
			</span>
			<Card.Title class="text-xl">{m.auth_reset_title()}</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if !token}
				<p class="text-center text-sm text-destructive">
					{m.auth_reset_invalid()}
				</p>
				<Button href="/forgot-password" class="mt-4 w-full">{m.auth_reset_new_link()}</Button>
			{:else}
				<form onsubmit={submit} class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<Label for="password">{m.auth_reset_new()}</Label>
						<Input id="password" type="password" bind:value={password} required minlength={8} />
					</div>
					<div class="flex flex-col gap-2">
						<Label for="confirm">{m.auth_reset_confirm()}</Label>
						<Input id="confirm" type="password" bind:value={confirm} required minlength={8} />
					</div>
					{#if error}
						<p class="text-sm text-destructive">{error}</p>
					{/if}
					<Button type="submit" class="w-full" disabled={loading}>
						{loading ? m.settings_saving() : m.auth_reset_button()}
					</Button>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
