import * as m from '$lib/paraglide/messages';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const USERNAME_REGEX = /^[A-Za-z0-9_]{3,16}$/;

/** Validates a Minecraft username against the Mojang API. */
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) return json({ valid: false, reason: m.subdomain_not_logged_in() }, { status: 401 });

	const name = (url.searchParams.get('name') ?? '').trim();
	if (!USERNAME_REGEX.test(name)) {
		return json({ valid: false, reason: m.mcplayer_invalid() });
	}

	const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`);
	if (!res.ok) return json({ valid: false, reason: m.mcplayer_not_found() });

	const profile = (await res.json()) as { id: string; name: string };
	return json({ valid: true, name: profile.name });
};
