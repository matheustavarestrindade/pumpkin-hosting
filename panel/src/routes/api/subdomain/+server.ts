import { db } from '$lib/server/db';
import { servers } from '$lib/server/db/schema';
import { validateSubdomain } from '$lib/subdomains';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) return json({ available: false, reason: 'Not logged in' }, { status: 401 });

	const name = (url.searchParams.get('name') ?? '').toLowerCase();
	const valid = validateSubdomain(name);
	if (!valid.ok) return json({ available: false, reason: valid.reason });

	const existing = await db
		.select({ id: servers.id })
		.from(servers)
		.where(eq(servers.subdomain, name))
		.limit(1);

	if (existing.length > 0) return json({ available: false, reason: 'Name is taken' });
	return json({ available: true });
};
