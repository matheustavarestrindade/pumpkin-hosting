import { db } from '$lib/server/db';
import { servers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const ADJECTIVES = [
	'happy', 'sleepy', 'mighty', 'tiny', 'golden', 'silver', 'clever', 'brave', 'calm', 'wild',
	'lucky', 'sunny', 'misty', 'frosty', 'dusty', 'rusty', 'jolly', 'witty', 'zesty', 'mellow',
	'swift', 'quiet', 'loud', 'proud', 'fancy', 'shiny', 'fuzzy', 'breezy', 'cozy', 'crispy',
	'dizzy', 'eager', 'gentle', 'hasty', 'icy', 'jumpy', 'kind', 'lively', 'merry', 'noble',
	'peppy', 'quirky', 'rapid', 'silly', 'tidy', 'upbeat', 'vivid', 'warm', 'young', 'zippy'
];

const NOUNS = [
	'panda', 'turtle', 'fox', 'wolf', 'bear', 'otter', 'llama', 'golem', 'slime', 'creeper',
	'oak', 'birch', 'spruce', 'ember', 'frost', 'storm', 'river', 'meadow', 'canyon', 'peak',
	'cove', 'grove', 'field', 'forge', 'tower', 'bridge', 'harbor', 'island', 'valley', 'cave',
	'crystal', 'diamond', 'amethyst', 'quartz', 'basalt', 'granite', 'marble', 'flint', 'obsidian', 'copper',
	'rocket', 'comet', 'nebula', 'orbit', 'pixel', 'voxel', 'chunk', 'beacon', 'portal', 'anvil'
];

function pick<T>(list: T[]): T {
	return list[Math.floor(Math.random() * list.length)];
}

export function randomSlug(): string {
	return `${pick(ADJECTIVES)}-${pick(NOUNS)}`;
}

/** Generates a slug guaranteed free in the servers table. */
export async function generateUniqueSlug(): Promise<string> {
	for (let i = 0; i < 20; i++) {
		// after 10 plain tries, add a numeric suffix to widen the space
		const slug = i < 10 ? randomSlug() : `${randomSlug()}-${Math.floor(Math.random() * 90 + 10)}`;
		const taken = await db
			.select({ id: servers.id })
			.from(servers)
			.where(eq(servers.subdomain, slug))
			.limit(1);
		if (taken.length === 0) return slug;
	}
	return `${randomSlug()}-${crypto.randomUUID().slice(0, 4)}`;
}
