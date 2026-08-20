<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import * as m from '$lib/paraglide/messages';

	const features = $derived([
		{ title: m.landing_f1_title(), desc: m.landing_f1_desc() },
		{ title: m.landing_f2_title(), desc: m.landing_f2_desc() },
		{ title: m.landing_f3_title(), desc: m.landing_f3_desc() },
		{ title: m.landing_f4_title(), desc: m.landing_f4_desc() },
		{ title: m.landing_f5_title(), desc: m.landing_f5_desc() },
		{ title: m.landing_f6_title(), desc: m.landing_f6_desc() }
	]);

	const planFeatures = $derived([
		m.landing_plan_f1(),
		m.landing_plan_f2(),
		m.landing_plan_f3(),
		m.landing_plan_f4(),
		m.landing_plan_f5(),
		m.landing_plan_f6()
	]);
</script>

<Navbar>
	{#snippet right()}
		<Button variant="ghost" size="sm" href="/login">{m.auth_login_button()}</Button>
		<Button size="sm" href="/register">{m.auth_signup()}</Button>
	{/snippet}
</Navbar>

<main>
	<section class="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
		<h1 class="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			{m.landing_hero_title()}
		</h1>
		<p class="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
			{m.landing_hero_sub()}
		</p>
		<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
			<Button size="lg" href="/register" class="w-full sm:w-auto">{m.landing_cta_create()}</Button>
			<Button size="lg" variant="outline" href="#pricing" class="w-full sm:w-auto">{m.landing_cta_pricing()}</Button>
		</div>
		<p class="mt-8 font-mono text-sm text-muted-foreground">
			{m.landing_address_hint()}
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
			<h2 class="text-center text-2xl font-bold text-foreground">{m.landing_pricing_title()}</h2>
			<p class="mt-2 text-center text-muted-foreground">{m.landing_pricing_sub()}</p>
			<Card.Root class="mx-auto mt-8 max-w-sm">
				<Card.Header>
					<div class="flex items-baseline justify-between">
						<Card.Title>{m.landing_plan_name()}</Card.Title>
						<p class="text-foreground">
							<span class="text-2xl font-bold">R$10</span>
							<span class="text-sm text-muted-foreground">{m.landing_plan_per()}</span>
						</p>
					</div>
				</Card.Header>
				<Card.Content>
					<ul class="space-y-2 text-sm text-muted-foreground">
						{#each planFeatures as pf (pf)}
							<li>{pf}</li>
						{/each}
					</ul>
				</Card.Content>
				<Card.Footer>
					<Button class="w-full" href="/register">{m.landing_plan_cta()}</Button>
				</Card.Footer>
			</Card.Root>
		</div>
	</section>
</main>

<footer class="border-t border-border">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-muted-foreground">
		<span>hosting-mc</span>
		<span>{m.landing_footer_disclaimer()}</span>
	</div>
</footer>
