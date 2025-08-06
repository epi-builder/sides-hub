import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeon, NeonDatabase } from 'drizzle-orm/neon-serverless';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as NodePool } from 'pg';
import ws from 'ws';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

let db: NeonDatabase<typeof schema>;
const url = process.env.DATABASE_URL;

if (url.includes('neon.tech')) {
  // Use Neon's serverless driver
  console.log('Using Neon database driver.');
  neonConfig.webSocketConstructor = ws;
  const pool = new NeonPool({ connectionString: url });
  db = drizzleNeon(pool, { schema });
} else {
  // Use standard PostgreSQL driver
  console.log('Using standard PostgreSQL driver.');
  const pool = new NodePool({ connectionString: url });
  db = drizzleNode(pool, { schema });
}

export { db };
