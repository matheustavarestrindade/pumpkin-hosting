import * as m from '$lib/paraglide/messages';
import { agent } from '$lib/server/agent';
import { db } from '$lib/server/db';
import { nodes, plans, servers, user as userTable } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import { billingEnabled, createCheckout, getOrCreateCustomer } from '$lib/server/stripe';
import { defaultSettings } from '$lib/server-settings';
import { validateSubdomain } from '$lib/subdomains';
import { fail, redirect } from '@sveltejs/kit';
import { eq, inArray, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireUser(locals);
	const [plan] = await db.select().from(plans).where(eq(plans.active, true)).limit(1);
	return { plan: plan ?? null };
};

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const subdomain = String(form.get('subdomain') ?? '').toLowerCase();
		const name = String(form.get('name') ?? '').trim();
		const type = String(form.get('type') ?? '');

		if (!name) return fail(400, { error: m.new_error_name() });
		if (!['survival', 'creative', 'hardcore', 'flat'].includes(type)) {
			return fail(400, { error: m.new_error_type() });
		}
		const valid = validateSubdomain(subdomain);
		if (!valid.ok) return fail(400, { error: valid.reason });

		const taken = await db
			.select({ id: servers.id })
			.from(servers)
			.where(eq(servers.subdomain, subdomain))
			.limit(1);
		if (taken.length > 0) return fail(400, { error: m.subdomain_taken() });

		const [plan] = await db.select().from(plans).where(eq(plans.active, true)).limit(1);
		if (!plan) return fail(500, { error: m.new_error_no_plan() });

		// Pick the active node with the fewest servers
		const activeNodes = await db.select().from(nodes).where(eq(nodes.status, 'active'));
		if (activeNodes.length === 0) return fail(500, { error: m.new_error_no_nodes() });

		const counts = await db
			.select({ nodeId: servers.nodeId, total: sql<number>`count(*)::int` })
			.from(servers)
			.where(inArray(servers.nodeId, activeNodes.map((n) => n.id)))
			.groupBy(servers.nodeId);
		const countByNode = new Map(counts.map((c) => [c.nodeId, c.total]));

		const node = activeNodes
			.filter((n) => (countByNode.get(n.id) ?? 0) < n.maxServers)
			.sort((a, b) => (countByNode.get(a.id) ?? 0) - (countByNode.get(b.id) ?? 0))[0];
		if (!node) return fail(503, { error: m.new_error_no_nodes() });

		const serverType = type as 'survival' | 'creative' | 'hardcore' | 'flat';
		const settings = defaultSettings(serverType);
		settings.maxPlayers = plan.maxPlayers;

		const id = crypto.randomUUID();
		const volumeName = `world-${id}`;

		await db.insert(servers).values({
			id,
			userId: user.id,
			nodeId: node.id,
			planId: plan.id,
			name,
			subdomain,
			type: serverType,
			volumeName,
			status: 'provisioning',
			settings
		});

		if (billingEnabled) {
			// Paid flow: Stripe checkout activates the server via webhook.
			const [userRow] = await db
				.select({ stripeCustomerId: userTable.stripeCustomerId })
				.from(userTable)
				.where(eq(userTable.id, user.id))
				.limit(1);
			const customerId = await getOrCreateCustomer({
				id: user.id,
				email: user.email,
				name: user.name,
				stripeCustomerId: userRow?.stripeCustomerId ?? null
			});
			if (userRow?.stripeCustomerId !== customerId) {
				await db.update(userTable).set({ stripeCustomerId: customerId }).where(eq(userTable.id, user.id));
			}
			const checkoutUrl = await createCheckout({
				serverId: id,
				customerId,
				successUrl: `${url.origin}/servers/${id}?created=1`,
				cancelUrl: `${url.origin}/servers/new`
			});
			redirect(303, checkoutUrl);
		}

		// Dev mode (no Stripe keys): activate immediately.
		try {
			const { containerId } = await agent.createServer(node, {
				serverId: id,
				subdomain,
				image: 'ghcr.io/pumpkin-mc/pumpkin:master',
				volumeName,
				memMb: plan.memMb,
				cpuMillicores: plan.cpuMillicores,
				settings
			});
			await db
				.update(servers)
				.set({ containerId, status: 'running', updatedAt: new Date() })
				.where(eq(servers.id, id));
		} catch (e) {
			console.error('agent createServer failed', e);
			await db.update(servers).set({ status: 'error', updatedAt: new Date() }).where(eq(servers.id, id));
		}

		redirect(303, `/servers/${id}`);
	}
};
