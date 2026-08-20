import { agent } from '$lib/server/agent';
import { db } from '$lib/server/db';
import { nodes, servers, user as userTable, type ServerSettings } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import { billingEnabled, createCheckout, createPortalSession, getOrCreateCustomer } from '$lib/server/stripe';
import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

async function getOwnedServer(id: string, userId: string) {
	const [row] = await db
		.select({ server: servers, node: nodes })
		.from(servers)
		.innerJoin(nodes, eq(nodes.id, servers.nodeId))
		.where(and(eq(servers.id, id), eq(servers.userId, userId)))
		.limit(1);
	if (!row) error(404, 'Server not found');
	return row;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = requireUser(locals);
	const { server } = await getOwnedServer(params.id, user.id);
	const [userRow] = await db
		.select({ stripeCustomerId: userTable.stripeCustomerId })
		.from(userTable)
		.where(eq(userTable.id, user.id))
		.limit(1);
	return {
		server,
		billing: {
			enabled: billingEnabled,
			hasCustomer: Boolean(userRow?.stripeCustomerId)
		}
	};
};

export const actions: Actions = {
	power: async ({ request, params, locals }) => {
		const { server, node } = await getOwnedServer(params.id, requireUser(locals).id);
		const form = await request.formData();
		const action = String(form.get('action'));

		if (action === 'start' && (server.status === 'stopped' || server.status === 'error')) {
			await db.update(servers).set({ status: 'starting' }).where(eq(servers.id, server.id));
			try {
				await agent.startServer(node, server);
				await db.update(servers).set({ status: 'running' }).where(eq(servers.id, server.id));
			} catch (e) {
				console.error("agent power failed", e);
				await db.update(servers).set({ status: 'error' }).where(eq(servers.id, server.id));
			}
		} else if (action === 'stop' && server.status === 'running') {
			await db.update(servers).set({ status: 'stopping' }).where(eq(servers.id, server.id));
			try {
				await agent.stopServer(node, server);
				await db.update(servers).set({ status: 'stopped' }).where(eq(servers.id, server.id));
			} catch (e) {
				console.error("agent power failed", e);
				await db.update(servers).set({ status: 'error' }).where(eq(servers.id, server.id));
			}
		}
	},

	apply: async ({ request, params, locals }) => {
		const { server, node } = await getOwnedServer(params.id, requireUser(locals).id);
		const form = await request.formData();

		const settings: ServerSettings = {
			...server.settings,
			difficulty: String(form.get('difficulty')) as ServerSettings['difficulty'],
			gamemode: String(form.get('gamemode')) as ServerSettings['gamemode'],
			pvp: form.get('pvp') === 'on',
			motd: String(form.get('motd') ?? '').slice(0, 64),
			allowlistEnabled: form.get('allowlistEnabled') === 'on',
			allowlist: form
				.getAll('friend')
				.map((s) => String(s).trim())
				.filter((s) => /^[A-Za-z0-9_]{3,16}$/.test(s))
		};

		await db
			.update(servers)
			.set({ settings, updatedAt: new Date() })
			.where(eq(servers.id, server.id));

		try {
			await agent.applySettings(node, server, settings);
		} catch {
			return fail(502, { error: 'Saved, but the server could not be reached. Applies on next start.' });
		}
		return { saved: true };
	},

		portal: async ({ params, locals, url }) => {
		const user = requireUser(locals);
		await getOwnedServer(params.id, user.id);
		const [userRow] = await db
			.select({ stripeCustomerId: userTable.stripeCustomerId })
			.from(userTable)
			.where(eq(userTable.id, user.id))
			.limit(1);
		if (!userRow?.stripeCustomerId) return fail(400, { billingError: 'No billing account yet' });
		const portalUrl = await createPortalSession(
			userRow.stripeCustomerId,
			`${url.origin}/servers/${params.id}`
		);
		redirect(303, portalUrl);
	},

	payNow: async ({ params, locals, url }) => {
		const user = requireUser(locals);
		const { server } = await getOwnedServer(params.id, user.id);
		const [userRow] = await db
			.select()
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
			serverId: server.id,
			customerId,
			successUrl: `${url.origin}/servers/${server.id}?paid=1`,
			cancelUrl: `${url.origin}/servers/${server.id}`
		});
		redirect(303, checkoutUrl);
	},

	delete: async ({ params, locals }) => {		const { server, node } = await getOwnedServer(params.id, requireUser(locals).id);
		try {
			await agent.deleteServer(node, server);
		} catch {
			// Agent unreachable: reconcile loop cleans the container later.
		}
		await db.delete(servers).where(eq(servers.id, server.id));
		redirect(303, '/dashboard');
	}
};
