import { sql } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from 'drizzle-orm/pg-core';

// ---------- better-auth core tables (do not modify) ----------

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	stripeCustomerId: text('stripe_customer_id'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(t) => [index('session_userId_idx').on(t.userId)]
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		issuer: text('issuer'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('account_userId_idx').on(t.userId)]
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('verification_identifier_idx').on(t.identifier)]
);

// ---------- app tables ----------

export const nodeStatus = pgEnum('node_status', ['active', 'draining', 'offline']);

export const serverType = pgEnum('server_type', ['survival', 'creative', 'hardcore', 'flat']);

export const serverStatus = pgEnum('server_status', [
	'provisioning',
	'stopped',
	'starting',
	'running',
	'stopping',
	'error',
	'suspended'
]);

export type ServerSettings = {
	difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
	pvp: boolean;
	maxPlayers: number;
	gamemode: 'survival' | 'creative';
	motd: string;
	allowlistEnabled: boolean;
	allowlist: string[];
	hardcore: boolean;
};

export const plans = pgTable('plans', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	priceCents: integer('price_cents').notNull(),
	currency: text('currency').notNull().default('eur'),
	maxPlayers: integer('max_players').notNull(),
	memMb: integer('mem_mb').notNull(),
	cpuMillicores: integer('cpu_millicores').notNull(),
	stripePriceId: text('stripe_price_id').notNull(),
	active: boolean('active').notNull().default(true)
});

export const nodes = pgTable('nodes', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	apiUrl: text('api_url').notNull(),
	apiToken: text('api_token').notNull(),
	maxServers: integer('max_servers').notNull(),
	status: nodeStatus('status').notNull().default('active'),
	lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const servers = pgTable(
	'servers',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		nodeId: uuid('node_id')
			.notNull()
			.references(() => nodes.id),
		planId: uuid('plan_id')
			.notNull()
			.references(() => plans.id),
		name: text('name').notNull(),
		subdomain: text('subdomain').notNull(),
		type: serverType('type').notNull(),
		image: text('image').notNull().default('ghcr.io/pumpkin-mc/pumpkin:master'),
		containerId: text('container_id'),
		volumeName: text('volume_name').notNull(),
		status: serverStatus('status').notNull().default('provisioning'),
		settings: jsonb('settings').$type<ServerSettings>().notNull(),
		stripeSubscriptionId: text('stripe_subscription_id'),
		lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
		deletionScheduledAt: timestamp('deletion_scheduled_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		uniqueIndex('servers_subdomain_idx').on(t.subdomain),
		index('servers_user_idx').on(t.userId),
		index('servers_node_idx').on(t.nodeId),
		index('servers_status_idx').on(t.status)
	]
);

export const stripeEvents = pgTable('stripe_events', {
	id: text('id').primaryKey(),
	type: text('type').notNull(),
	processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow()
});

export const auditLog = pgTable('audit_log', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
	serverId: uuid('server_id').references(() => servers.id, { onDelete: 'set null' }),
	action: text('action').notNull(),
	meta: jsonb('meta').$type<Record<string, unknown>>(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
});
