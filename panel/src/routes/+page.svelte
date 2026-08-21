<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import * as m from '$lib/paraglide/messages';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import UsersIcon from '@lucide/svelte/icons/users';
	import XIcon from '@lucide/svelte/icons/x';

	const steps = $derived([
		{ title: m.landing_step1_title(), desc: m.landing_step1_desc() },
		{ title: m.landing_step2_title(), desc: m.landing_step2_desc() },
		{ title: m.landing_step3_title(), desc: m.landing_step3_desc() }
	]);

	const jargon = $derived([
		m.landing_notech_1(),
		m.landing_notech_2(),
		m.landing_notech_3(),
		m.landing_notech_4(),
		m.landing_notech_5(),
		m.landing_notech_6()
	]);

	const features = $derived([
		{ icon: UsersIcon, title: m.landing_f1_title(), desc: m.landing_f1_desc() },
		{ icon: MoonIcon, title: m.landing_f2_title(), desc: m.landing_f2_desc() },
		{ icon: DownloadIcon, title: m.landing_f3_title(), desc: m.landing_f3_desc() },
		{ icon: SlidersHorizontalIcon, title: m.landing_f4_title(), desc: m.landing_f4_desc() }
	]);

	const planFeatures = $derived([
		m.landing_plan_f1(),
		m.landing_plan_f2(),
		m.landing_plan_f3(),
		m.landing_plan_f4(),
		m.landing_plan_f5(),
		m.landing_plan_f6()
	]);

	const faqs = $derived([
		{ q: m.landing_faq1_q(), a: m.landing_faq1_a() },
		{ q: m.landing_faq2_q(), a: m.landing_faq2_a() },
		{ q: m.landing_faq3_q(), a: m.landing_faq3_a() },
		{ q: m.landing_faq4_q(), a: m.landing_faq4_a() }
	]);
</script>

<svelte:head>
	<title>hosting-mc</title>
</svelte:head>

<Navbar>
	{#snippet right()}
		<Button variant="ghost" size="sm" href="/login">{m.auth_login_button()}</Button>
		<Button size="sm" href="/register">{m.auth_signup()}</Button>
	{/snippet}
</Navbar>

<main>
	<!-- hero -->
	<section class="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
		<span class="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
			{m.landing_hero_badge()}
		</span>
		<h1 class="mx-auto mt-5 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
			{m.landing_hero_title()}
		</h1>
		<p class="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
			{m.landing_hero_sub()}
		</p>
		<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
			<Button size="lg" href="/register" class="w-full sm:w-auto">{m.landing_cta_create()}</Button>
			<Button size="lg" variant="outline" href="#how" class="w-full sm:w-auto">{m.landing_cta_how()}</Button>
		</div>
		<div class="mx-auto mt-10 max-w-md rounded-2xl border border-border bg-card p-4 shadow-sm">
			<p class="text-xs text-muted-foreground">{m.landing_address_hint()}</p>
			<p class="mt-1 font-mono text-lg font-semibold text-primary">coolkids.example.com</p>
		</div>
	</section>

	<!-- how it works -->
	<section id="how" class="border-t border-border bg-card/50">
		<div class="mx-auto max-w-6xl px-4 py-16">
			<h2 class="text-center text-2xl font-bold text-foreground">{m.landing_steps_title()}</h2>
			<p class="mx-auto mt-2 max-w-md text-center text-muted-foreground">{m.landing_steps_sub()}</p>
			<div class="mt-10 grid gap-4 sm:grid-cols-3">
				{#each steps as step, i (step.title)}
					<Card.Root>
						<Card.Content class="pt-5">
							<span class="flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
								{i + 1}
							</span>
							<h3 class="mt-4 font-semibold text-foreground">{step.title}</h3>
							<p class="mt-1.5 text-sm text-muted-foreground">{step.desc}</p>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
			<div class="mx-auto mt-8 grid max-w-2xl grid-cols-4 gap-2">
				{#each ['survival', 'hardcore', 'creative', 'flat'] as t (t)}
					<img src="/images/types/{t}.png" alt={t} class="aspect-square w-full rounded-xl border border-border object-cover" />
				{/each}
			</div>
		</div>
	</section>

	<!-- no tech skills -->
	<section class="border-t border-border">
		<div class="mx-auto max-w-6xl px-4 py-16 text-center">
			<h2 class="text-2xl font-bold text-foreground">{m.landing_notech_title()}</h2>
			<p class="mx-auto mt-2 max-w-md text-muted-foreground">{m.landing_notech_sub()}</p>
			<div class="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-2.5">
				{#each jargon as j (j)}
					<span class="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">
						<XIcon class="size-3.5" /> {j}
					</span>
				{/each}
			</div>
		</div>
	</section>

	<!-- features -->
	<section class="border-t border-border bg-card/50">
		<div class="mx-auto max-w-6xl px-4 py-16">
			<h2 class="text-center text-2xl font-bold text-foreground">{m.landing_features_title()}</h2>
			<div class="mt-10 grid gap-4 sm:grid-cols-2">
				{#each features as f (f.title)}
					<Card.Root>
						<Card.Content class="flex gap-4 pt-5">
							<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<f.icon class="size-5" />
							</span>
							<span>
								<h3 class="font-semibold text-foreground">{f.title}</h3>
								<p class="mt-1 text-sm text-muted-foreground">{f.desc}</p>
							</span>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</div>
	</section>

	<!-- pricing -->
	<section id="pricing" class="border-t border-border">
		<div class="mx-auto max-w-6xl px-4 py-16">
			<h2 class="text-center text-2xl font-bold text-foreground">{m.landing_pricing_title()}</h2>
			<p class="mt-2 text-center text-muted-foreground">{m.landing_pricing_sub()}</p>
			<Card.Root class="mx-auto mt-8 max-w-sm">
				<Card.Header>
					<div class="flex items-baseline justify-between">
						<Card.Title>{m.landing_plan_name()}</Card.Title>
						<p class="text-foreground">
							<span class="text-3xl font-bold">R$10</span>
							<span class="text-sm text-muted-foreground">{m.landing_plan_per()}</span>
						</p>
					</div>
				</Card.Header>
				<Card.Content>
					<ul class="space-y-2 text-sm text-muted-foreground">
						{#each planFeatures as pf (pf)}
							<li class="flex items-center gap-2">
								<span class="size-1.5 rounded-full bg-primary"></span>{pf}
							</li>
						{/each}
					</ul>
				</Card.Content>
				<Card.Footer>
					<Button size="lg" class="w-full" href="/register">{m.landing_plan_cta()}</Button>
				</Card.Footer>
			</Card.Root>
		</div>
	</section>

	<!-- faq -->
	<section class="border-t border-border bg-card/50">
		<div class="mx-auto max-w-2xl px-4 py-16">
			<h2 class="text-center text-2xl font-bold text-foreground">{m.landing_faq_title()}</h2>
			<div class="mt-8 flex flex-col gap-3">
				{#each faqs as f (f.q)}
					<Card.Root>
						<Card.Content class="pt-4">
							<h3 class="font-semibold text-foreground">{f.q}</h3>
							<p class="mt-1.5 text-sm text-muted-foreground">{f.a}</p>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</div>
	</section>

	<!-- final cta -->
	<section class="border-t border-border">
		<div class="mx-auto max-w-6xl px-4 py-20 text-center">
			<h2 class="text-3xl font-bold text-foreground">{m.landing_final_title()}</h2>
			<p class="mx-auto mt-3 max-w-md text-muted-foreground">{m.landing_final_sub()}</p>
			<Button size="lg" href="/register" class="mt-8">{m.landing_cta_create()}</Button>
		</div>
	</section>
</main>

<footer class="border-t border-border">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-muted-foreground">
		<span>hosting-mc</span>
		<span>{m.landing_footer_disclaimer()}</span>
	</div>
</footer>
