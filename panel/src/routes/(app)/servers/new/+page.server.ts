import { agent } from '$lib/server/agent';
import { db } from '$lib/server/db';
import { nodes, plans, servers } from '$lib/server/db/schema';
import { defaultSettings } from '$lib/server-settings';
import { validateSubdomain } from '$lib/subdomains';
import { fail, redirect } from '@sveltejs/kit';
import { eq, inArray, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [plan] = await db.select().from(plans).where(eq(plans.active, true)).limit(1);
	return { plan: plan ?? null };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const subdomain = String(form.get('subdomain') ?? '').toLowerCase();
		const name = String(form.get('name') ?? '').trim();
		const type = String(form.get('type') ?? '');

		if (!name) return fail(400, { error: 'Name is required' });
		if (!['survival', 'creative', 'hardcore', 'flat'].includes(type)) {
			return fail(400, { error: 'Invalid server type' });
		}
		const valid = validateSubdomain(subdomain);
		if (!valid.ok) return fail(400, { error: valid.reason });

		const taken = await db
			.select({ id: servers.id })
			.from(servers)
			.where(eq(servers.subdomain, subdomain))
			.limit(1);
		if (taken.length > 0) return fail(400, { error: 'Name is taken' });

		const [plan] = await db.select().from(plans).where(eq(plans.active, true)).limit(1);
		if (!plan) return fail(500, { error: 'No plan available' });

		// Pick the active node with the fewest servers
		const activeNodes = await db.select().from(nodes).where(eq(nodes.status, 'active'));
		if (activeNodes.length === 0) return fail(500, { error: 'No node available' });

		const counts = await db
			.select({ nodeId: servers.nodeId, total: sql<number>`count(*)::int` })
			.from(servers)
			.where(inArray(servers.nodeId, activeNodes.map((n) => n.id)))
			.groupBy(servers.nodeId);
		const countByNode = new Map(counts.map((c) => [c.nodeId, c.total]));

		const node = activeNodes
			.filter((n) => (countByNode.get(n.id) ?? 0) < n.maxServers)
			.sort((a, b) => (countByNode.get(a.id) ?? 0) - (countByNode.get(b.id) ?? 0))[0];
		if (!node) return fail(503, { error: 'All nodes are full, please try again later' });

		const serverType = type as 'survival' | 'creative' | 'hardcore' | 'flat';
		const settings = defaultSettings(serverType);
		settings.maxPlayers = plan.maxPlayers;

		const id = crypto.randomUUID();
		const volumeName = `world-${id}`;

		// TODO(phase-5): create Stripe Checkout session here and only insert
		// the server row after the webhook confirms payment.
		await db.insert(servers).values({
			id,
			userId: locals.user!.id,
			nodeId: node.id,
			planId: plan.id,
			name,
			subdomain,
			type: serverType,
			volumeName,
			status: 'provisioning',
			settings
		});

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
			// Agent unreachable: status error, user can retry from the server page.
			await db.update(servers).set({ status: 'error', updatedAt: new Date() }).where(eq(servers.id, id));
		}

		redirect(303, `/servers/${id}`);
	}
};
