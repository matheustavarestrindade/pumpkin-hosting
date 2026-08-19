import type { ServerSettings, nodes, servers } from '$lib/server/db/schema';

type Node = typeof nodes.$inferSelect;
type Server = typeof servers.$inferSelect;

export type CreateServerRequest = {
	serverId: string;
	subdomain: string;
	image: string;
	volumeName: string;
	memMb: number;
	cpuMillicores: number;
	settings: ServerSettings;
};

async function call<T>(node: Node, path: string, method = 'GET', body?: unknown): Promise<T> {
	const res = await fetch(`${node.apiUrl}${path}`, {
		method,
		headers: {
			authorization: `Bearer ${node.apiToken}`,
			'content-type': 'application/json'
		},
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`agent ${method} ${path} failed: ${res.status} ${text}`);
	}
	const text = await res.text();
	return (text ? JSON.parse(text) : null) as T;
}

export const agent = {
	createServer: (node: Node, req: CreateServerRequest) =>
		call<{ containerId: string }>(node, '/api/servers', 'POST', req),

	startServer: (node: Node, server: Server) =>
		call(node, `/api/servers/${server.id}/start`, 'POST'),

	stopServer: (node: Node, server: Server) =>
		call(node, `/api/servers/${server.id}/stop`, 'POST'),

	deleteServer: (node: Node, server: Server) =>
		call(node, `/api/servers/${server.id}`, 'DELETE'),

	applySettings: (node: Node, server: Server, settings: ServerSettings) =>
		call(node, `/api/servers/${server.id}/settings`, 'PUT', settings),

	serverStatus: (node: Node, server: Server) =>
		call<{ status: string; playersOnline: number | null }>(node, `/api/servers/${server.id}/status`)
};
