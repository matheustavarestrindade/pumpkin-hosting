import { agent } from '$lib/server/agent';
import { db } from '$lib/server/db';
import { auditLog, nodes, plans, servers, stripeEvents, user } from '$lib/server/db/schema';
import { stripe } from '$lib/server/stripe';
import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type Stripe from 'stripe';
import type { RequestHandler } from './$types';

const GRACE_DAYS = 7;

export const POST: RequestHandler = async ({ request }) => {
	if (!stripe) error(503, 'Stripe not configured');

	const signature = request.headers.get('stripe-signature');
	const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
	if (!signature || !webhookSecret) error(400, 'Missing signature');

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
	} catch {
		error(400, 'Invalid signature');
	}

	// Idempotency: first writer wins, duplicates are skipped.
	const inserted = await db
		.insert(stripeEvents)
		.values({ id: event!.id, type: event!.type })
		.onConflictDoNothing()
		.returning({ id: stripeEvents.id });
	if (inserted.length === 0) return json({ received: true, duplicate: true });

	try {
		switch (event!.type) {
			case 'checkout.session.completed':
				await onCheckoutCompleted(event!.data.object as Stripe.Checkout.Session);
				break;
			case 'customer.subscription.deleted':
				await onSubscriptionDeleted(event!.data.object as Stripe.Subscription);
				break;
			case 'invoice.payment_failed': {
				const invoice = event!.data.object as Stripe.Invoice;
				await db.insert(auditLog).values({
					action: 'stripe.payment_failed',
					meta: { invoiceId: invoice.id }
				});
				break;
			}
		}
	} catch (e) {
		// Remove the event row so Stripe's retry can process it again.
		await db.delete(stripeEvents).where(eq(stripeEvents.id, event!.id));
		throw e;
	}

	return json({ received: true });
};

async function findServer(serverId: string) {
	const [row] = await db
		.select({ server: servers, node: nodes, plan: plans })
		.from(servers)
		.innerJoin(nodes, eq(nodes.id, servers.nodeId))
		.innerJoin(plans, eq(plans.id, servers.planId))
		.where(eq(servers.id, serverId))
		.limit(1);
	return row ?? null;
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
	const serverId = session.metadata?.serverId ?? session.client_reference_id;
	if (!serverId) throw new Error('checkout.session.completed without serverId');

	const row = await findServer(serverId);
	if (!row) throw new Error(`server ${serverId} not found`);

	if (typeof session.customer === 'string') {
		await db
			.update(user)
			.set({ stripeCustomerId: session.customer })
			.where(eq(user.id, row.server.userId));
	}

	const subscriptionId =
		typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

	const wasSuspended = row.server.status === 'suspended';

	await db
		.update(servers)
		.set({
			stripeSubscriptionId: subscriptionId ?? null,
			deletionScheduledAt: null,
			status: wasSuspended ? 'stopped' : 'provisioning',
			updatedAt: sql`now()`
		})
		.where(eq(servers.id, serverId));

	try {
		if (wasSuspended) {
			// Reactivation: container still exists, just start it.
			await agent.startServer(row.node, row.server);
		} else {
			const { containerId } = await agent.createServer(row.node, {
				serverId: row.server.id,
				subdomain: row.server.subdomain,
				image: row.server.image,
				volumeName: row.server.volumeName,
				memMb: row.plan.memMb,
				cpuMillicores: row.plan.cpuMillicores,
				settings: row.server.settings
			});
			await db.update(servers).set({ containerId }).where(eq(servers.id, serverId));
		}
		await db
			.update(servers)
			.set({ status: 'running', updatedAt: sql`now()` })
			.where(eq(servers.id, serverId));
	} catch {
		await db
			.update(servers)
			.set({ status: 'error', updatedAt: sql`now()` })
			.where(eq(servers.id, serverId));
	}
}

async function onSubscriptionDeleted(subscription: Stripe.Subscription) {
	const serverId = subscription.metadata?.serverId;
	if (!serverId) return;

	const row = await findServer(serverId);
	if (!row) return;

	try {
		await agent.stopServer(row.node, row.server);
	} catch {
		// Container may already be stopped; suspend either way.
	}

	await db
		.update(servers)
		.set({
			status: 'suspended',
			deletionScheduledAt: new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000),
			updatedAt: sql`now()`
		})
		.where(eq(servers.id, serverId));
}
