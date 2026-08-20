import { auth } from '$lib/auth';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	event.locals.session = session?.session ?? null;
	event.locals.user = session?.user ?? null;
	return paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		return svelteKitHandler({
			event,
			auth,
			building,
			resolve: (e: Parameters<typeof resolve>[0], opts?: Parameters<typeof resolve>[1]) =>
				resolve(e, {
					...opts,
					transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
				})
		});
	});
};
