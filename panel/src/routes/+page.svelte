<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Navbar from '$lib/components/ui/Navbar.svelte';

	const features = [
		{
			title: 'One click to online',
			desc: 'Pick a name, pick a game type, pay. Your server is live in under a minute.'
		},
		{
			title: 'Your own address',
			desc: 'Every server gets a clean address like steve.example.com. No ports, no IPs to remember.'
		},
		{
			title: 'Simple settings',
			desc: 'Difficulty, friends list, game mode — a few switches, no config files, no wiki required.'
		},
		{
			title: 'Invite only friends',
			desc: 'Built-in friends list. Only the people you add can join your world.'
		},
		{
			title: 'Download your world',
			desc: 'Your world is yours. Download a full copy anytime, even after you cancel.'
		},
		{
			title: 'Fair price',
			desc: 'Modern Rust server tech uses a fraction of the memory, so you pay a fraction of the price.'
		}
	];
</script>

<Navbar>
	{#snippet right()}
		<Button variant="ghost" size="sm" href="/login">Log in</Button>
		<Button size="sm" href="/register">Sign up</Button>
	{/snippet}
</Navbar>

<main>
	<section class="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
		<h1 class="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			A Minecraft server for you and your friends, in one click
		</h1>
		<p class="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
			No config files. No port forwarding. No command line. Pick a name and play.
		</p>
		<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
			<Button size="lg" href="/register" class="w-full sm:w-auto">Create your server</Button>
			<Button size="lg" variant="outline" href="#pricing" class="w-full sm:w-auto">See pricing</Button>
		</div>
		<p class="mt-8 font-mono text-sm text-muted-foreground">
			your server address:
			<span class="rounded-md border border-border bg-card px-2 py-1 text-primary">steve.example.com</span>
		</p>
	</section>

	<section class="border-t border-border">
		<div class="mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 lg:grid-cols-3">
			{#each features as f (f.title)}
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-base">{f.title}</Card.Title>
						<Card.Description>{f.desc}</Card.Description>
					</Card.Header>
				</Card.Root>
			{/each}
		</div>
	</section>

	<section id="pricing" class="border-t border-border">
		<div class="mx-auto max-w-6xl px-4 py-16">
			<h2 class="text-center text-2xl font-bold text-foreground">One plan. That's it.</h2>
			<p class="mt-2 text-center text-muted-foreground">Everything you need to play with friends.</p>
			<Card.Root class="mx-auto mt-8 max-w-sm">
				<Card.Header>
					<div class="flex items-baseline justify-between">
						<Card.Title>Friends</Card.Title>
						<p class="text-foreground">
							<span class="text-2xl font-bold">R$10</span>
							<span class="text-sm text-muted-foreground">/month</span>
						</p>
					</div>
				</Card.Header>
				<Card.Content>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li>Up to 10 players</li>
						<li>Custom address (steve.example.com)</li>
						<li>Survival, Creative, Hardcore or Flat</li>
						<li>Friends list for your buddies</li>
						<li>World download anytime</li>
						<li>Cancel anytime</li>
					</ul>
				</Card.Content>
				<Card.Footer>
					<Button class="w-full" href="/register">Get started</Button>
				</Card.Footer>
			</Card.Root>
		</div>
	</section>
</main>

<footer class="border-t border-border">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-muted-foreground">
		<span>hosting-mc</span>
		<span>Not affiliated with Mojang or Microsoft.</span>
	</div>
</footer>
