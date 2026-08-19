import { agent } from '$lib/server/agent';
import { db } from '$lib/server/db';
import { nodes, servers, type ServerSettings } from '$lib/server/db/schema';
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
	const { server } = await getOwnedServer(params.id, locals.user!.id);
	return { server };
};

export const actions: Actions = {
	power: async ({ request, params, locals }) => {
		const { server, node } = await getOwnedServer(params.id, locals.user!.id);
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

	saveSettings: async ({ request, params, locals }) => {
		const { server, node } = await getOwnedServer(params.id, locals.user!.id);
		const form = await request.formData();

		const settings: ServerSettings = {
			...server.settings,
			difficulty: String(form.get('difficulty')) as ServerSettings['difficulty'],
			pvp: form.get('pvp') === 'on',
			motd: String(form.get('motd') ?? '').slice(0, 64)
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

	saveAllowlist: async ({ request, params, locals }) => {
		const { server, node } = await getOwnedServer(params.id, locals.user!.id);
		const form = await request.formData();

		const allowlistRaw = String(form.get('allowlist') ?? '');
		const settings: ServerSettings = {
			...server.settings,
			allowlistEnabled: form.get('allowlistEnabled') === 'on',
			allowlist: allowlistRaw
				.split('\n')
				.map((s) => s.trim())
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

	delete: async ({ params, locals }) => {
		const { server, node } = await getOwnedServer(params.id, locals.user!.id);
		try {
			await agent.deleteServer(node, server);
		} catch {
			// Agent unreachable: reconcile loop cleans the container later.
		}
		await db.delete(servers).where(eq(servers.id, server.id));
		redirect(303, '/dashboard');
	}
};
