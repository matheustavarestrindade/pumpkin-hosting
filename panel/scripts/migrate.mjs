import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
	connectionString: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/hostingmc'
});

await pool.query(`
	create table if not exists _migrations (
		name text primary key,
		applied_at timestamptz not null default now()
	)
`);

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'drizzle');
const files = readdirSync(dir)
	.filter((f) => f.endsWith('.sql'))
	.sort();

for (const file of files) {
	const applied = await pool.query('select 1 from _migrations where name = $1', [file]);
	if (applied.rowCount > 0) continue;

	const sql = readFileSync(join(dir, file), 'utf8');
	console.log(`applying ${file}`);
	await pool.query('begin');
	try {
		await pool.query(sql);
		await pool.query('insert into _migrations (name) values ($1)', [file]);
		await pool.query('commit');
	} catch (e) {
		await pool.query('rollback');
		throw e;
	}
}

console.log('migrations up to date');
await pool.end();
