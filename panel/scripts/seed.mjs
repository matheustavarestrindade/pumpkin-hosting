import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
	connectionString: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/hostingmc'
});

const stripePriceId = process.env.STRIPE_PRICE_ID ?? 'price_placeholder';

const res = await pool.query(`select id from plans where name = 'Friends' limit 1`);
if (res.rowCount === 0) {
	await pool.query(
		`insert into plans (name, price_cents, currency, max_players, mem_mb, cpu_millicores, stripe_price_id)
		 values ('Friends', 1000, 'brl', 10, 1024, 2000, $1)`,
		[stripePriceId]
	);
	console.log('plan "Friends" created');
} else {
	await pool.query(`update plans set stripe_price_id = $1, price_cents = 1000, currency = 'brl', mem_mb = 1024, cpu_millicores = 2000 where name = 'Friends'`, [stripePriceId]);
	console.log('plan "Friends" updated');
}

const nodeId = process.env.NODE_ID ?? '00000000-0000-0000-0000-000000000001';
const nodeRes = await pool.query(`select id from nodes where name = 'node-1' limit 1`);
if (nodeRes.rowCount === 0) {
	await pool.query(
		`insert into nodes (id, name, api_url, api_token, max_servers, status)
		 values ($1, 'node-1', 'http://agent:3001', $2, 100, 'active')`,
		[nodeId, process.env.AGENT_TOKEN ?? 'change-me-shared-with-agent']
	);
	console.log('node "node-1" created');
} else {
	console.log('node "node-1" already exists');
}

await pool.end();
